'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import LottieLoader from '../../components/LottieLoader'

const LOADER_SRC = '/lottie/space%20boy%20developer.json'

export default function Admin() {
  const [totalMembers, setTotalMembers] = useState(0)
  const [pendingMembers, setPendingMembers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMembersOpen, setIsMembersOpen] = useState(true)
  const [isTeamsOpen, setIsTeamsOpen] = useState(true)
  const [portalQuery, setPortalQuery] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/members')
        if (!response.ok) return
        const data = await response.json()
        if (!Array.isArray(data)) return
        setTotalMembers(data.length)
        setPendingMembers(data.filter((member) => member.status === 'pending').length)
      } catch {}
      finally {
        setIsLoading(false)
      }
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    const updateAuth = () => {
      setUserRole(localStorage.getItem('demoRole') || '')
    }
    updateAuth()
    window.addEventListener('demoAuthChanged', updateAuth)
    return () => window.removeEventListener('demoAuthChanged', updateAuth)
  }, [])

  const portalItems = [
    {
      key: 'members',
      href: '/admin/members',
      label: 'Tüm Üyeler',
      eyebrow: 'Üye Yönetimi',
      description: 'Üye listesini yönet ve detayları düzenle.',
      count: totalMembers,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z" />
          <path d="M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9" />
          <path d="M4 15v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4" />
        </svg>
      ),
    },
    {
      key: 'approvals',
      href: '/admin/approvals',
      label: 'Bekleyen Onaylar',
      eyebrow: 'Onay Akışı',
      description: 'Onay bekleyen üyeleri görüntüle ve karar ver.',
      count: pendingMembers,
      soft: pendingMembers === 0,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M9.5 16.5 5 12l1.4-1.4 3.1 3.1L17.6 5.6 19 7z" />
          <path d="M4 4h12a2 2 0 0 1 2 2v6h-2V6H4v12h12v-4h2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
      ),
    },
  ]

  const teamItems = [
    {
      key: 'team-management',
      label: 'Takım Yönetimi',
      eyebrow: 'Takım İşlemleri',
      description: 'Takım yapısı ve liderlik düzenlemeleri yakında.',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M7.5 11a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 7.5 11zm9 0a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 16.5 11zM3 20a4.5 4.5 0 0 1 9 0v1H3zm9.5 1v-1a4.5 4.5 0 0 1 9 0v1z" />
        </svg>
      ),
    },
    {
      key: 'my-team',
      label: 'Takımım',
      eyebrow: 'Takım İşlemleri',
      description: 'Takım üyeleri ve görev görünümü yakında.',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 12a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 12 12zm-6 8a6 6 0 0 1 12 0v1H6z" />
        </svg>
      ),
    },
  ]

  const filteredItems = portalItems.filter((item) => {
    const haystack = `${item.label} ${item.eyebrow} ${item.description}`.toLowerCase()
    return haystack.includes(portalQuery.trim().toLowerCase())
  })

  const filteredTeamItems = teamItems.filter((item) => {
    const haystack = `${item.label} ${item.eyebrow} ${item.description}`.toLowerCase()
    return haystack.includes(portalQuery.trim().toLowerCase())
  })

  return (
    <div className="page">
      <div className="admin-card admin-portal-card-wrap">
        <div className="admin-portal-header">
          <div>
            <h1>Yönetim Paneli</h1>
            <p className="admin-subtitle">Yönetim Araçları</p>
          </div>
          <div className="admin-portal-actions">
            <input
              className="admin-portal-search"
              value={portalQuery}
              onChange={(event) => setPortalQuery(event.target.value)}
              placeholder="Ara"
            />
            <div className="admin-portal-pill">Portal</div>
          </div>
        </div>
        <div className="admin-portal-section">
          <button
            type="button"
            className="admin-portal-section-toggle"
            onClick={() => setIsMembersOpen((prev) => !prev)}
          >
            <span>Üye İşlemler</span>
            <span className={`admin-portal-chevron ${isMembersOpen ? 'open' : ''}`}>
              ▾
            </span>
          </button>
          {isMembersOpen && (
            <div className="admin-portal-grid">
              {isLoading ? (
                <div className="admin-loading admin-portal-loading admin-loading-overlay">
                  <LottieLoader src={LOADER_SRC} label="Modüller hazırlanıyor..." size={150} />
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isApprovalsLocked =
                    item.key === 'approvals' && userRole === 'lead'
                  if (isApprovalsLocked) {
                    return (
                      <div
                        key={item.key}
                        className={`admin-portal-card admin-portal-card-soft`}
                        aria-disabled="true"
                      >
                        <div className="admin-portal-card-top">
                          <div className="admin-portal-icon" aria-hidden="true">
                            {item.icon}
                          </div>
                          <span className="admin-portal-eyebrow">{item.eyebrow}</span>
                        </div>
                        <div className="admin-portal-count">{item.count}</div>
                        <h2>{item.label}</h2>
                        <p>Yalnızca yönetim ve kurucu erişebilir.</p>
                        <div className="admin-portal-cta">Kilitli</div>
                      </div>
                    )
                  }
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`admin-portal-card ${
                        item.soft ? 'admin-portal-card-soft' : ''
                      }`}
                    >
                      <div className="admin-portal-card-top">
                        <div className="admin-portal-icon" aria-hidden="true">
                          {item.icon}
                        </div>
                        <span className="admin-portal-eyebrow">{item.eyebrow}</span>
                      </div>
                      <div className="admin-portal-count">{item.count}</div>
                      <h2>{item.label}</h2>
                      <p>{item.description}</p>
                      <div className="admin-portal-cta">Ekrana git →</div>
                    </Link>
                  )
                })
              )}
            </div>
          )}
        </div>
        <div className="admin-portal-section">
          <button
            type="button"
            className="admin-portal-section-toggle"
            onClick={() => setIsTeamsOpen((prev) => !prev)}
          >
            <span>Takım İşlemleri</span>
            <span className={`admin-portal-chevron ${isTeamsOpen ? 'open' : ''}`}>
              ▾
            </span>
          </button>
          {isTeamsOpen && (
            <div className="admin-portal-grid">
              {filteredTeamItems.map((item) => (
                <div
                  key={item.key}
                  className="admin-portal-card admin-portal-card-soft"
                  aria-disabled="true"
                >
                  <div className="admin-portal-card-top">
                    <div className="admin-portal-icon" aria-hidden="true">
                      {item.icon}
                    </div>
                    <span className="admin-portal-eyebrow">{item.eyebrow}</span>
                  </div>
                  <h2>{item.label}</h2>
                  <p>{item.description}</p>
                  <div className="admin-portal-cta">Yakında</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
