'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Sidebar({ onLoginClick = () => {} }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileTitle, setProfileTitle] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')

  useEffect(() => {
    const savedOpen = localStorage.getItem('sidebarOpen')
    if (savedOpen === 'true') {
      setIsOpen(true)
    }
    const updateAuth = () => {
      setIsLoggedIn(localStorage.getItem('demoAuth') === 'true')
      setUserRole(localStorage.getItem('demoRole') || '')
      const firstName = localStorage.getItem('demoProfileName') || ''
      const lastName = localStorage.getItem('demoProfileSurname') || ''
      const fullName = `${firstName} ${lastName}`.trim()
      setProfileName(fullName || 'Profil')
      setProfileTitle(localStorage.getItem('demoProfileTitle') || 'Ünvan')
      const userId = localStorage.getItem('demoUserId') || ''
      if (userId) {
        const avatarKey = `demoAvatar:${userId}`
        setProfileAvatar(localStorage.getItem(avatarKey) || '/avatar-placeholder.svg')
      } else {
        setProfileAvatar('/avatar-placeholder.svg')
      }
    }
    updateAuth()
    window.addEventListener('demoAuthChanged', updateAuth)
    return () => window.removeEventListener('demoAuthChanged', updateAuth)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', isOpen)
    localStorage.setItem('sidebarOpen', isOpen ? 'true' : 'false')
    return () => document.body.classList.remove('sidebar-open')
  }, [isOpen])

  const handleLogout = () => {
    localStorage.removeItem('demoAuth')
    localStorage.removeItem('demoRole')
    setUserRole('')
    setProfileName('')
    setProfileTitle('')
    setProfileAvatar('')
    setIsLoggedIn(false)
    setIsOpen(false)
    window.dispatchEvent(new Event('demoAuthChanged'))
  }
  
  const navItems = [
    { href: '/', label: 'ANASAYFA' },
    { href: '/about', label: 'HAKKIMIZDA' },
    { href: '/projects', label: 'PROJELER' },
    { href: '/announcements', label: 'DUYURULAR' },
    { href: '/sponsors', label: 'SPONSORLARIMIZ' },
    { href: '/contact', label: 'İLETİŞİM' },
  ]
  const adminItems = userRole === 'management' ? [{ href: '/admin', label: 'YÖNETİM PANELİ' }] : []

  return (
    <>
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>
      
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-scroll">
          <div className="sidebar-header">
            <Link href="/" className="logo" onClick={() => setIsOpen(false)}>
              <img src="/logo.png" alt="Gazi Uzay Logo" className="logo-image" />
            </Link>
          </div>

          <div className="nav-separator"></div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
            {adminItems.length > 0 && <div className="nav-separator nav-separator-admin" />}
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link nav-link-admin ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            {isLoggedIn && (
              <Link href="/profile" className="sidebar-profile" onClick={() => setIsOpen(false)}>
                <div className="sidebar-profile-avatar">
                  <img src={profileAvatar || '/avatar-placeholder.svg'} alt="Profil" />
                </div>
                <div className="sidebar-profile-text">
                  <span>{profileName}</span>
                  <strong>{profileTitle}</strong>
                </div>
              </Link>
            )}
            {isLoggedIn ? (
              <button type="button" className="btn-login" onClick={handleLogout}>
                <span className="nav-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                    <polyline points="10,17 15,12 10,7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </span>
                <span className="nav-label">ÇIKIŞ YAP</span>
              </button>
            ) : (
              <button type="button" className="btn-login" onClick={onLoginClick}>
                <span className="nav-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                    <polyline points="10,17 15,12 10,7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </span>
                <span className="nav-label">GİRİŞ YAP</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  )
}
