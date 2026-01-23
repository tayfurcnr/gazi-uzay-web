'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar({ onLoginClick }) {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/announcements', label: 'Duyurular' },
    { href: '/projects', label: 'Projeler' },
    { href: '/teams', label: 'Takım' },
    { href: '/events', label: 'Etkinlikler' }
  ]

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link href="/" className="logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">GAZI UZAY</span>
          </Link>
        </div>
        
        <div className="navbar-menu">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              target="_self"
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="navbar-user">
          <button type="button" className="btn-login" onClick={onLoginClick}>Giriş Yap</button>
        </div>
      </div>
    </nav>
  )
}
