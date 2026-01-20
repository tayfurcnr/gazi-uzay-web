import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

const canManage = (role) =>
  role === 'MANAGEMENT' || role === 'FOUNDER' || role === 'LEAD'

const parseYear = (value) => {
  const year = Number.parseInt(value, 10)
  return Number.isNaN(year) ? null : year
}

const splitName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const toMemberDto = (user) => {
  const profile = user.profile
  const nameParts = splitName(user.name || '')
  const startYear = profile?.startYear ? String(profile.startYear) : ''
  const endYear = profile?.endYear ? String(profile.endYear) : ''

  return {
    id: user.id,
    firstName: profile?.firstName || nameParts.firstName,
    lastName: profile?.lastName || nameParts.lastName,
    email: user.email || profile?.email || '',
    phone: profile?.phone || '',
    title: profile?.title || '',
    position: profile?.position || '',
    company: profile?.company || '',
    linkedinUrl: profile?.linkedinUrl || '',
    memberStart: startYear,
    memberEnd: endYear || (profile?.isActive ? 'active' : ''),
    status: user.status ? user.status.toLowerCase() : 'pending',
    role: user.role ? user.role.toLowerCase() : 'guest',
    avatar: profile?.avatarUrl || user.image || '',
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManage(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (session.user.role === 'LEAD') {
    const leadProject = await prisma.project.findUnique({
      where: { id },
      select: { leadId: true },
    })
    if (!leadProject || leadProject.leadId !== session.user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const description =
    typeof body?.description === 'string' ? body.description.trim() : ''
  const achievement =
    typeof body?.achievement === 'string' ? body.achievement.trim() : ''
  const driveUrl = typeof body?.driveUrl === 'string' ? body.driveUrl.trim() : ''
  const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : ''
  const year = body?.year ? parseYear(body.year) : null
  const memberIds = Array.isArray(body?.memberIds)
    ? [...new Set(body.memberIds.filter(Boolean))]
    : null
  const memberEntries = Array.isArray(body?.members)
    ? body.members
        .filter((member) => member?.userId)
        .map((member) => ({
          userId: member.userId,
          role: typeof member.role === 'string' ? member.role.trim() : null,
        }))
    : null

  const data = {}
  if (name) data.name = name
  if (description) {
    if (description.length < 50) {
      return NextResponse.json({ error: 'description_too_short' }, { status: 400 })
    }
    if (description.length > 170) {
      return NextResponse.json({ error: 'description_too_long' }, { status: 400 })
    }
    data.description = description
  }
  if (achievement) data.achievement = achievement
  if (driveUrl) data.driveUrl = driveUrl
  if (imageUrl) data.imageUrl = imageUrl
  if (year) data.year = year
  if (memberIds || memberEntries) {
    const membersPayload = memberEntries?.length
      ? memberEntries
      : (memberIds || []).map((userId) => ({ userId, role: null }))
    data.members = {
      deleteMany: {},
      createMany: {
        data: membersPayload,
        skipDuplicates: true,
      },
    }
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
    include: {
      lead: { select: { id: true, name: true, email: true } },
      members: { include: { user: { include: { profile: true } } } },
    },
  })

  return NextResponse.json({
    ...updated,
    members: updated.members.map((member) => ({
      ...toMemberDto(member.user),
      projectRole: member.role || '',
    })),
  })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManage(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (session.user.role === 'LEAD') {
    const leadProject = await prisma.project.findUnique({
      where: { id },
      select: { leadId: true },
    })
    if (!leadProject || leadProject.leadId !== session.user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
