'use client'

import { useEffect, useState } from 'react'

const DEFAULT_DATA = {
  bannerSubtitle: 'Bize Ulaşın',
  bannerText:
    'Bir fikir, bir proje veya bir soru mu var? Gazi Uzay ekibiyle bağlantı kurun, birlikte ilerleyelim.',
  joinText: 'BİZE KATIL!',
  joinHref: 'https://wa.me/',
  email: {
    value: 'gaziuzay@gmail.com',
    href: 'mailto:gaziuzay@gmail.com',
  },
  instagram: {
    value: 'instagram.com/gaziuzay',
    href: 'https://instagram.com/gaziuzay',
  },
  x: {
    value: 'x.com/gaziuzay',
    href: 'https://x.com/gaziuzay',
  },
  linkedin: {
    value: 'linkedin.com/company/gaziuzay',
    href: 'https://linkedin.com/company/gaziuzay',
  },
  web: {
    value: 'gaziuzay.org',
    href: 'https://gaziuzay.org',
  },
  address:
    'Makine Mühendisliği İdari Binası Alt Kat, Yamaçtepe, 27410 Şahinbey/Gaziantep',
  mapUrl:
    'https://www.google.com/maps?q=Makine%20M%C3%BChendisli%C4%9Fi%20%C4%B0dari%20Binas%C4%B1%20Alt%20Kat%2C%20Yama%C3%A7tepe%2C%2027410%20%C5%9Eahinbey%2FGaziantep&output=embed',
}

const STORAGE_KEY = 'contactData'

function mergeData(base, stored) {
  if (!stored) return base
  return {
    ...base,
    ...stored,
    email: { ...base.email, ...(stored.email || {}) },
    instagram: { ...base.instagram, ...(stored.instagram || {}) },
    x: { ...base.x, ...(stored.x || {}) },
    linkedin: { ...base.linkedin, ...(stored.linkedin || {}) },
    web: { ...base.web, ...(stored.web || {}) },
  }
}

const normalizeRole = (value) => {
  if (value === 'admin') return 'management'
  if (value === 'publisher') return 'lead'
  if (value === 'editor') return 'member'
  return value || ''
}

export default function Contact() {
  const [data, setData] = useState(DEFAULT_DATA)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setData(mergeData(DEFAULT_DATA, JSON.parse(stored)))
      } catch {
        setData(DEFAULT_DATA)
      }
    }
    const updateAuth = () => {
      setIsLoggedIn(localStorage.getItem('demoAuth') === 'true')
      const storedRole = localStorage.getItem('demoRole') || ''
      const normalized = normalizeRole(storedRole)
      if (normalized !== storedRole) {
        localStorage.setItem('demoRole', normalized)
      }
      setUserRole(normalized)
    }
    updateAuth()
    window.addEventListener('demoAuthChanged', updateAuth)
    return () => window.removeEventListener('demoAuthChanged', updateAuth)
  }, [])

  const canEditPage = isLoggedIn && userRole === 'management'

  useEffect(() => {
    if (!canEditPage && isEditing) {
      setIsEditing(false)
    }
  }, [canEditPage, isEditing])

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setIsEditing(false)
  }

  const handleCancel = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setData(mergeData(DEFAULT_DATA, JSON.parse(stored)))
      } catch {
        setData(DEFAULT_DATA)
      }
    } else {
      setData(DEFAULT_DATA)
    }
    setIsEditing(false)
  }

  const updateField = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const updateItem = (key, field, value) => {
    setData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  const socialItems = [
    {
      key: 'email',
      label: 'E-posta',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2 8 5 8-5" />
        </svg>
      ),
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1.2" />
        </svg>
      ),
    },
    {
      key: 'x',
      label: 'X',
      icon: (
        <svg className="contact-icon-fill" viewBox="0 0 24 24">
          <path d="M18.244 2h3.308l-7.227 8.26L22 22h-6.172l-4.826-6.106L5.7 22H2.4l7.73-8.835L2 2h6.33l4.37 5.7L18.244 2z" />
        </svg>
      ),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 10v7M8 7v.5M12 10v7m0-4a2.5 2.5 0 0 1 5 0v4" />
        </svg>
      ),
    },
    {
      key: 'web',
      label: 'Web',
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a12 12 0 0 1 0 18M12 3a12 12 0 0 0 0 18" />
        </svg>
      ),
    },
  ]

  return (
    <div className="page">
      {canEditPage && (
        <div className="contact-edit-actions contact-edit-actions-top">
          {!isEditing ? (
            <button type="button" className="contact-edit-btn" onClick={() => setIsEditing(true)}>
              Sayfayı Düzenle
            </button>
          ) : (
            <>
              <button type="button" className="contact-edit-btn" onClick={handleSave}>
                Kaydet
              </button>
              <button
                type="button"
                className="contact-edit-btn contact-edit-btn-secondary"
                onClick={handleCancel}
              >
                İptal
              </button>
            </>
          )}
        </div>
      )}

        <div className="contact-banner">
          <div className="contact-banner-content">
          {isEditing ? (
            <div className="contact-edit-block">
              <label className="contact-edit-label">Baslik</label>
              <input
                className="contact-edit-input contact-edit-input-center"
                value={data.bannerSubtitle}
                onChange={(event) => updateField('bannerSubtitle', event.target.value)}
              />
            </div>
          ) : (
            <p className="page-subtitle page-subtitle-strong">{data.bannerSubtitle}</p>
          )}
          {isEditing ? (
            <div className="contact-edit-block">
              <label className="contact-edit-label">Aciklama</label>
              <textarea
                className="contact-edit-input contact-edit-textarea"
                value={data.bannerText}
                onChange={(event) => updateField('bannerText', event.target.value)}
              />
            </div>
          ) : (
            <p className="contact-banner-text">{data.bannerText}</p>
          )}
        </div>
      </div>

      <div className="contact-join contact-join-hero">
        {isEditing ? (
          <div className="contact-edit-row contact-edit-row-wide">
            <div className="contact-edit-block">
              <label className="contact-edit-label">Buton Metni</label>
              <input
                className="contact-edit-input contact-edit-input-lg contact-edit-input-center"
                value={data.joinText}
                onChange={(event) => updateField('joinText', event.target.value)}
              />
            </div>
            <div className="contact-edit-block">
              <label className="contact-edit-label">Buton Linki</label>
              <input
                className="contact-edit-input contact-edit-input-center"
                value={data.joinHref}
                onChange={(event) => updateField('joinHref', event.target.value)}
              />
            </div>
          </div>
        ) : (
          <a
            className="contact-join-btn contact-join-btn-lg"
            href={data.joinHref}
            target="_blank"
            rel="noreferrer"
          >
            {data.joinText}
          </a>
        )}
      </div>

      <div className="contact-grid">
        <div className="contact-card">
          <h2>İletişim & Sosyal Medya</h2>
          <div className="nav-separator"></div>
          <ul className="contact-list">
            {socialItems.map((item) => {
              const value = data[item.key].value
              const href = data[item.key].href
              const Wrapper = isEditing ? 'div' : 'a'
              const isExternal = href.startsWith('http')
              const wrapperProps = isEditing
                ? { className: 'contact-social' }
                : {
                    className: 'contact-social',
                    href,
                    ...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {}),
                  }
              return (
                <li key={item.key}>
                  <Wrapper {...wrapperProps}>
                    <span className="contact-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div>
                      <span className="contact-label">{item.label}</span>
                      {isEditing ? (
                        <div className="contact-edit-row">
                          <div className="contact-edit-block">
                            <label className="contact-edit-label">Gorunen Metin</label>
                            <input
                              className="contact-edit-input"
                              value={value}
                              onChange={(event) => updateItem(item.key, 'value', event.target.value)}
                            />
                          </div>
                          <div className="contact-edit-block">
                            <label className="contact-edit-label">Link</label>
                            <input
                              className="contact-edit-input"
                              value={href}
                              onChange={(event) => updateItem(item.key, 'href', event.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="contact-value">{value}</span>
                      )}
                    </div>
                  </Wrapper>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="contact-card">
          <h2>Adres / Harita</h2>
          <div className="nav-separator"></div>
          <div className="contact-map">
            <div className="contact-map-inner">
              <iframe
                title="Gazi Uzay Konum"
                src={data.mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          {isEditing && (
            <div className="contact-edit-block">
              <label className="contact-edit-label">Harita Linki</label>
              <input
                className="contact-edit-input contact-edit-input-center"
                value={data.mapUrl}
                onChange={(event) => updateField('mapUrl', event.target.value)}
              />
            </div>
          )}
          {isEditing ? (
            <div className="contact-edit-block">
              <label className="contact-edit-label">Adres</label>
              <textarea
                className="contact-edit-input contact-edit-textarea"
                value={data.address}
                onChange={(event) => updateField('address', event.target.value)}
              />
            </div>
          ) : (
            <p className="contact-address">{data.address}</p>
          )}
        </div>
      </div>

    </div>
  )
}
