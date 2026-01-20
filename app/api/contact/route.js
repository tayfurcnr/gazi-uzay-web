import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../lib/prisma'

const isAdmin = (role) => role === 'MANAGEMENT' || role === 'FOUNDER' || role === 'LEAD'

const toContactResponse = (record) => {
  if (!record) return null
  return {
    bannerSubtitle: record.bannerSubtitle,
    bannerText: record.bannerText,
    joinText: record.joinText,
    joinHref: record.joinHref,
    email: { value: record.emailValue, href: record.emailHref },
    instagram: { value: record.instagramValue, href: record.instagramHref },
    x: { value: record.xValue, href: record.xHref },
    linkedin: { value: record.linkedinValue, href: record.linkedinHref },
    web: { value: record.webValue, href: record.webHref },
    address: record.address,
    mapUrl: record.mapUrl,
  }
}

const toContactUpdate = (body) => ({
  bannerSubtitle: body?.bannerSubtitle ?? '',
  bannerText: body?.bannerText ?? '',
  joinText: body?.joinText ?? '',
  joinHref: body?.joinHref ?? '',
  emailValue: body?.email?.value ?? '',
  emailHref: body?.email?.href ?? '',
  instagramValue: body?.instagram?.value ?? '',
  instagramHref: body?.instagram?.href ?? '',
  xValue: body?.x?.value ?? '',
  xHref: body?.x?.href ?? '',
  linkedinValue: body?.linkedin?.value ?? '',
  linkedinHref: body?.linkedin?.href ?? '',
  webValue: body?.web?.value ?? '',
  webHref: body?.web?.href ?? '',
  address: body?.address ?? '',
  mapUrl: body?.mapUrl ?? '',
})

export async function GET() {
  const record = await prisma.contactSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(toContactResponse(record))
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const payload = toContactUpdate(await request.json())
  const existing = await prisma.contactSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
  })

  const saved = existing
    ? await prisma.contactSettings.update({
        where: { id: existing.id },
        data: payload,
      })
    : await prisma.contactSettings.create({ data: payload })

  return NextResponse.json(toContactResponse(saved))
}
