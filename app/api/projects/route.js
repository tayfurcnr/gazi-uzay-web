import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

const canManage = (role) => role === 'MANAGEMENT' || role === 'FOUNDER'

const parseYear = (value) => {
  const year = Number.parseInt(value, 10)
  return Number.isNaN(year) ? null : year
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManage(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = (body?.name || '').trim()
  const description = (body?.description || '').trim()
  const leadId = (body?.leadId || '').trim()
  const year = parseYear(body?.year)

  if (!name || !description || !leadId || !year) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (description.length < 50) {
    return NextResponse.json({ error: 'description_too_short' }, { status: 400 })
  }

  const lead = await prisma.user.findUnique({ where: { id: leadId } })
  if (!lead) {
    return NextResponse.json({ error: 'lead_not_found' }, { status: 400 })
  }

  const created = await prisma.project.create({
    data: {
      name,
      description,
      year,
      leadId,
    },
  })

  return NextResponse.json(created)
}
