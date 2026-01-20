import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

const isAdmin = (role) => role === 'MANAGEMENT' || role === 'FOUNDER' || role === 'LEAD'
const canManage = (role) => role === 'MANAGEMENT' || role === 'FOUNDER'
const TITLE_MIN = 2
const TITLE_MAX = 40
const BANNED_TITLE_TERMS = ['amk', 'sik', 'orospu', 'yarrak', 'salak', 'aptal', 'mal']

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

const normalizeRole = (value) => (value ? value.toUpperCase() : null)
const normalizeStatus = (value) => (value ? value.toUpperCase() : null)
const normalizeTitle = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizePhone = (value) => (typeof value === 'string' ? value.trim() : '')

const parseYear = (value) => {
  if (!value) return null
  const year = Number.parseInt(value, 10)
  return Number.isNaN(year) ? null : year
}

const validateTitle = (value) => {
  if (!value) return { ok: true, value: '' }
  if (value.length < TITLE_MIN || value.length > TITLE_MAX) {
    return { ok: false, message: `Ünvan ${TITLE_MIN}-${TITLE_MAX} karakter olmalıdır.` }
  }
  const allowed = /^[\p{L}\p{N}\s.'-]+$/u
  if (!allowed.test(value)) {
    return { ok: false, message: 'Ünvan yalnızca harf, sayı ve basit noktalama içerebilir.' }
  }
  const lowered = value.toLowerCase()
  if (BANNED_TITLE_TERMS.some((term) => lowered.includes(term))) {
    return { ok: false, message: 'Ünvan uygunsuz içerik içeremez.' }
  }
  return { ok: true, value }
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManage(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const role = normalizeRole(body.role)
  const status = normalizeStatus(body.status)
  const titleInput = normalizeTitle(body.title)
  const phoneInput = normalizePhone(body.phone)

  if (role === 'FOUNDER') {
    return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
  }

  const data = {}
  if (role) data.role = role
  if (status) data.status = status

  const needsProfileUpdate =
    typeof body.title === 'string' ||
    typeof body.phone === 'string' ||
    typeof body.memberStart === 'string' ||
    typeof body.memberEnd === 'string'

  if (needsProfileUpdate) {
    const target = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })
    if (!target?.profile) {
      return NextResponse.json({ error: 'profile_required' }, { status: 400 })
    }

    const profileUpdate = {}

    if (typeof body.title === 'string') {
      const titleResult = validateTitle(titleInput)
      if (!titleResult.ok) {
        return NextResponse.json(
          { error: 'title_invalid', message: titleResult.message },
          { status: 400 }
        )
      }
      profileUpdate.title = titleResult.value
      profileUpdate.titleUpdatedAt = titleResult.value ? new Date() : null
    }

    if (typeof body.phone === 'string') {
      const phoneValid = /^[0-9+()\s-]{6,20}$/.test(phoneInput)
      if (!phoneValid && phoneInput) {
        return NextResponse.json(
          { error: 'phone_invalid', message: 'Telefon formatı geçersiz.' },
          { status: 400 }
        )
      }
      profileUpdate.phone = phoneInput
    }

    if (typeof body.memberStart === 'string') {
      const startYear = parseYear(body.memberStart)
      if (!startYear) {
        return NextResponse.json({ error: 'memberStart_required' }, { status: 400 })
      }
      profileUpdate.startYear = startYear
    }

    if (typeof body.memberEnd === 'string') {
      if (!body.memberEnd || body.memberEnd === 'active') {
        profileUpdate.endYear = null
        profileUpdate.isActive = true
      } else {
        const endYear = parseYear(body.memberEnd)
        if (!endYear) {
          return NextResponse.json({ error: 'memberEnd_required' }, { status: 400 })
        }
        profileUpdate.endYear = endYear
        profileUpdate.isActive = false
      }
    }

    data.profile = { update: profileUpdate }
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    include: { profile: true },
  })

  return NextResponse.json(toMemberDto(updated))
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManage(session.user.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const target = await prisma.user.findUnique({
    where: { id },
  })

  if (!target) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (target.role === 'FOUNDER') {
    return NextResponse.json({ error: 'forbidden_role' }, { status: 403 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
