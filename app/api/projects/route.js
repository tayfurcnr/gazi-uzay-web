import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManage(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const projects = await prisma.project.findMany({
    where:
      session.user.role === 'LEAD'
        ? { leadId: session.user.id }
        : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      members: { include: { user: { include: { profile: true } } } },
    },
  })
  return NextResponse.json(
    projects.map((project) => ({
      ...project,
      members: project.members.map((member) => ({
        ...toMemberDto(member.user),
        projectRole: member.role || '',
      })),
    }))
  )
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (
    !session?.user ||
    !(session.user.role === 'MANAGEMENT' || session.user.role === 'FOUNDER')
  ) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = (body?.name || '').trim()
  const description = (body?.description || '').trim()
  const achievement = (body?.achievement || '').trim()
  const driveUrl = (body?.driveUrl || '').trim()
  const leadId = (body?.leadId || '').trim()
  const imageUrl = (body?.imageUrl || '').trim()
  const year = parseYear(body?.year)
  const memberIds = Array.isArray(body?.memberIds)
    ? [...new Set(body.memberIds.filter(Boolean))]
    : []
  const memberEntries = Array.isArray(body?.members)
    ? body.members
        .filter((member) => member?.userId)
        .map((member) => ({
          userId: member.userId,
          role: typeof member.role === 'string' ? member.role.trim() : null,
        }))
    : []

  if (!name || !description || !leadId || !year || !imageUrl) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (description.length < 50) {
    return NextResponse.json({ error: 'description_too_short' }, { status: 400 })
  }
  if (description.length > 170) {
    return NextResponse.json({ error: 'description_too_long' }, { status: 400 })
  }

  const lead = await prisma.user.findUnique({ where: { id: leadId } })
  if (!lead) {
    return NextResponse.json({ error: 'lead_not_found' }, { status: 400 })
  }

  const membersPayload = memberEntries.length
    ? memberEntries
    : memberIds.map((userId) => ({ userId, role: null }))

  const created = await prisma.project.create({
    data: {
      name,
      description,
      achievement: achievement || null,
      driveUrl: driveUrl || null,
      imageUrl,
      year,
      leadId,
      members: membersPayload.length
        ? {
            createMany: {
              data: membersPayload,
              skipDuplicates: true,
            },
          }
        : undefined,
    },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      members: { include: { user: { include: { profile: true } } } },
    },
  })

  return NextResponse.json({
    ...created,
    members: created.members.map((member) => toMemberDto(member.user)),
  })
}
