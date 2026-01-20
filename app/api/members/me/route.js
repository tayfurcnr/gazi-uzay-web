import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

const TITLE_MIN = 2
const TITLE_MAX = 40
const TITLE_COOLDOWN_MS = 24 * 60 * 60 * 1000
const BANNED_TITLE_TERMS = ['amk', 'sik', 'orospu', 'yarrak', 'salak', 'aptal', 'mal']

const splitName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const validateTitle = (value) => {
  const normalized = (value || '').trim()
  if (!normalized) return { ok: true, value: '' }
  if (normalized.length < TITLE_MIN || normalized.length > TITLE_MAX) {
    return { ok: false, message: `Ünvan ${TITLE_MIN}-${TITLE_MAX} karakter olmalıdır.` }
  }
  const allowed = /^[\p{L}\p{N}\s.'-]+$/u
  if (!allowed.test(normalized)) {
    return { ok: false, message: 'Ünvan yalnızca harf, sayı ve basit noktalama içerebilir.' }
  }
  const lowered = normalized.toLowerCase()
  if (BANNED_TITLE_TERMS.some((term) => lowered.includes(term))) {
    return { ok: false, message: 'Ünvan uygunsuz içerik içeremez.' }
  }
  return { ok: true, value: normalized }
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

  const titleResult = validateTitle(body.title)
  if (!titleResult.ok) {
    return NextResponse.json({ error: 'title_invalid', message: titleResult.message }, { status: 400 })
  }

  const nextStatus =
    user.status === 'APPROVED' || user.status === 'REJECTED' ? user.status : 'PENDING'
  const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim()
  const existingTitle = user.profile?.title || ''
  const titleChanged = (titleResult.value || '') !== (existingTitle || '')
  const lastTitleUpdate = user.profile?.titleUpdatedAt

  if (titleChanged && lastTitleUpdate) {
    const elapsed = Date.now() - new Date(lastTitleUpdate).getTime()
    if (elapsed < TITLE_COOLDOWN_MS) {
      return NextResponse.json(
        { error: 'title_rate_limited', message: 'Ünvan 24 saatte bir değiştirilebilir.' },
        { status: 429 }
      )
    }
  }

  const profileUpdate = {
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    phone: body.phone || '',
    email: session.user.email,
    title: titleResult.value,
    position: body.position || '',
    company: body.company || '',
    linkedinUrl: body.linkedinUrl || '',
    avatarUrl: body.avatar || '',
    startYear,
    endYear: endYearValue,
    isActive,
    ...(titleChanged ? { titleUpdatedAt: new Date() } : {}),
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: fullName || user.name,
      status: nextStatus,
      profile: {
        upsert: {
          update: profileUpdate,
          create: {
            ...profileUpdate,
            titleUpdatedAt: titleResult.value ? new Date() : null,
          },
        },
      },
    },
    include: { profile: true },
  })

  return NextResponse.json(toMemberDto(updated))
}
