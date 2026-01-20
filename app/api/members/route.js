import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

const isAdmin = (role) => role === 'MANAGEMENT' || role === 'FOUNDER'

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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users.map(toMemberDto))
}
