import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

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
    gender: profile?.gender || '',
    memberStart: startYear,
    memberEnd: endYear || (profile?.isActive ? 'active' : ''),
    status: user.status ? user.status.toLowerCase() : 'pending',
    role: user.role ? user.role.toLowerCase() : 'guest',
    avatar: profile?.avatarUrl || user.image || '',
  }
}

const parseYear = (value) => {
  if (!value) return null
  const year = Number.parseInt(value, 10)
  return Number.isNaN(year) ? null : year
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(toMemberDto(user))
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const body = await request.json()
  const startYear = parseYear(body.memberStart)
  const endYearValue = body.memberEnd === 'active' ? null : parseYear(body.memberEnd)
  const isActive = body.memberEnd === 'active' || !endYearValue

  if (!startYear) {
    return NextResponse.json({ error: 'memberStart_required' }, { status: 400 })
  }

  const nextStatus =
    user.status === 'APPROVED' || user.status === 'REJECTED' ? user.status : 'PENDING'
  const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim()

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: fullName || user.name,
      status: nextStatus,
      profile: {
        upsert: {
          update: {
            firstName: body.firstName || '',
            lastName: body.lastName || '',
            phone: body.phone || '',
            email: session.user.email,
            title: body.title || '',
            position: body.position || '',
            company: body.company || '',
            linkedinUrl: body.linkedinUrl || '',
            gender: body.gender || '',
            avatarUrl: body.avatar || '',
            startYear,
            endYear: endYearValue,
            isActive,
          },
          create: {
            userId: user.id,
            firstName: body.firstName || '',
            lastName: body.lastName || '',
            phone: body.phone || '',
            email: session.user.email,
            title: body.title || '',
            position: body.position || '',
            company: body.company || '',
            linkedinUrl: body.linkedinUrl || '',
            gender: body.gender || '',
            avatarUrl: body.avatar || '',
            startYear,
            endYear: endYearValue,
            isActive,
          },
        },
      },
    },
    include: { profile: true },
  })

  return NextResponse.json(toMemberDto(updated))
}
