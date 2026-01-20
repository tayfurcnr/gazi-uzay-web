'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

const MEMBERS_KEY = 'demoMembers'

const getNameParts = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const loadMembers = () => {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const upsertMember = (members, next) => {
  const index = members.findIndex((member) => member.id === next.id)
  if (index >= 0) {
    const copy = [...members]
    copy[index] = { ...copy[index], ...next }
    return copy
  }
  return [...members, next]
}

export default function AuthSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      const { firstName, lastName } = getNameParts(session.user.name || '')
      const nextUserId = session.user.email || session.user.name || ''

      localStorage.setItem('demoAuth', 'true')
      const roleValue = session.user.role || 'guest'
      localStorage.setItem('demoRole', roleValue.toLowerCase())
      localStorage.setItem('demoProfileName', firstName)
      localStorage.setItem('demoProfileSurname', lastName)
      if (session.user.email) {
        localStorage.setItem('demoProfileEmail', session.user.email)
      }
      if (nextUserId) {
        localStorage.setItem('demoUserId', nextUserId)
      }
      if (nextUserId) {
        const members = loadMembers()
        const nextMembers = upsertMember(members, {
          id: nextUserId,
          firstName,
          lastName,
          email: session.user.email || '',
          avatar: session.user.image || '',
          status: localStorage.getItem('demoProfileStatus') || 'pending',
          role: roleValue.toLowerCase(),
          updatedAt: Date.now(),
        })
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(nextMembers))
      }
      window.dispatchEvent(new Event('demoAuthChanged'))
      return
    }

    if (localStorage.getItem('demoAuth') === 'true') {
      localStorage.removeItem('demoAuth')
      localStorage.removeItem('demoRole')
      window.dispatchEvent(new Event('demoAuthChanged'))
    }
  }, [session, status])

  return null
}
