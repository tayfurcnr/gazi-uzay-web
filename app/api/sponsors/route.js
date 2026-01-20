import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

const isAdmin = (role) => role === 'MANAGEMENT' || role === 'FOUNDER' || role === 'LEAD'

export async function GET() {
  const record = await prisma.sponsorsSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(record?.data ?? null)
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const payload = await request.json()
  const existing = await prisma.sponsorsSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
  })

  const saved = existing
    ? await prisma.sponsorsSettings.update({
        where: { id: existing.id },
        data: { data: payload },
      })
    : await prisma.sponsorsSettings.create({ data: { data: payload } })

  return NextResponse.json(saved.data)
}
