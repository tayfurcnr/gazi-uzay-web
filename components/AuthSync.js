'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

const getNameParts = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export default function AuthSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      const { firstName, lastName } = getNameParts(session.user.name || '')
      const nextUserId = session.user.id || session.user.email || session.user.name || ''

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
      const syncProfile = async () => {
        try {
          const response = await fetch('/api/members/me')
          if (!response.ok) {
            window.dispatchEvent(new Event('demoAuthChanged'))
            return
          }
          const data = await response.json()
          localStorage.setItem('demoProfileName', data.firstName || '')
          localStorage.setItem('demoProfileSurname', data.lastName || '')
          localStorage.setItem('demoProfileEmail', data.email || '')
          localStorage.setItem('demoProfilePhone', data.phone || '')
          localStorage.setItem('demoProfileTitle', data.title || '')
          localStorage.setItem('demoProfilePosition', data.position || '')
          localStorage.setItem('demoProfileCompany', data.company || '')
          localStorage.setItem('demoProfileLinkedin', data.linkedinUrl || '')
          localStorage.setItem('demoProfileGender', data.gender || '')
          localStorage.setItem('demoProfileMemberStart', data.memberStart || '')
          localStorage.setItem('demoProfileMemberEnd', data.memberEnd || '')
          localStorage.setItem('demoProfileStatus', data.status || 'pending')
          if (data.avatar) {
            localStorage.setItem('demoProfileAvatar', data.avatar)
          }
          if (data.id) {
            localStorage.setItem('demoUserId', data.id)
          }
          if (data.role) {
            localStorage.setItem('demoRole', data.role)
          }
        } catch {
          // fall back to session-based defaults
        } finally {
          window.dispatchEvent(new Event('demoAuthChanged'))
        }
      }
      syncProfile()
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
