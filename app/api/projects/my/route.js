import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

const canView = (role) => role && role !== 'GUEST'

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
  if (!session?.user || !canView(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const userId = session.user.id
  const projects = await prisma.project.findMany({
    where: {
      OR: [{ leadId: userId }, { members: { some: { userId } } }],
    },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: {
      lead: { select: { id: true, name: true, email: true } },
      members: { include: { user: { include: { profile: true } } } },
    },
  })

  return NextResponse.json(
    projects.map((project) => {
      const memberEntry = project.members.find((member) => member.userId === userId)
      const myRole = project.leadId === userId ? 'lead' : memberEntry?.role || 'member'
      return {
        ...project,
        myRole,
        members: project.members.map((member) => ({
          ...toMemberDto(member.user),
          projectRole: member.role || '',
        })),
      }
    })
  )
}
