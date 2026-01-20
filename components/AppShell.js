'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import LoginModal from './LoginModal'
import AuthSync from './AuthSync'

export default function AppShell({ children }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const updateProfile = () => {
      const loggedIn = localStorage.getItem('demoAuth') === 'true'
      const name = localStorage.getItem('demoProfileName') || ''
      const surname = localStorage.getItem('demoProfileSurname') || ''
      setIsLoggedIn(loggedIn)
      setIsProfileComplete(Boolean(name.trim() && surname.trim()))
    }
    updateProfile()
    window.addEventListener('demoAuthChanged', updateProfile)
    return () => window.removeEventListener('demoAuthChanged', updateProfile)
  }, [])

  useEffect(() => {
    if (isLoggedIn && !isProfileComplete && pathname !== '/profile') {
      router.push('/profile')
    }
  }, [isLoggedIn, isProfileComplete, pathname, router])

  const isBlocked = isLoggedIn && !isProfileComplete && pathname !== '/profile'

  return (
    <>
      <AuthSync />
      <Sidebar onLoginClick={() => setIsLoginOpen(true)} />
      <main className="main-content">
        {isBlocked ? (
          <div className="profile-block">
            <h2>Profilinizi tamamlayın</h2>
            <p>İsim ve soyisim girmeden diğer sayfalara erişemezsiniz.</p>
          </div>
        ) : (
          children
        )}
        <div className="site-footer-note">© 2025 Gazi Uzay. Tüm hakları saklıdır.</div>
      </main>
      <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}
