'use client'

import { useEffect, useRef, useState } from 'react'

const DEFAULT_DATA = {
  banner: {
    title: 'Duyurular',
    text: 'Takım içi gelişmeler, etkinlik tarihleri ve proje bilgilendirmeleri.',
  },
  items: [
    {
      id: 'a1',
      title: 'Teknofest Takım Toplantısı',
      tag: 'Etkinlik',
      tagClass: '',
      date: '2025-02-02',
      dateInput: '2025-02-02',
      timeInput: '',
      published: true,
      visibility: 'member',
      description:
        'Toplantıda sezon hedefleri, görev dağılımı ve teslim takvimi netleştirilecektir. Katılım ve notlar için toplantı sonrası özet paylaşılacaktır.',
      footerLeft: 'Yer: B-302',
      links: [],
      imageUrl: '',
    },
    {
      id: 'a2',
      title: 'Uydu Alt Sistem Revizyonu',
      tag: 'Proje',
      tagClass: 'project',
      date: '2025-01-28',
      dateInput: '2025-01-28',
      timeInput: '',
      published: true,
      visibility: 'member',
      description:
        'Revizyon dokümanlarında güç bütçesi ve link budget tabloları güncellendi. Değişiklikler için bölüm sorumluları ile görüşme planlanacaktır.',
      footerLeft: 'Güncelleme',
      links: [],
      imageUrl: '',
    },
    {
      id: 'a3',
      title: 'Yeni Üye Oryantasyon Programı',
      tag: 'Genel',
      tagClass: 'general',
      date: '2025-01-20',
      dateInput: '2025-01-20',
      timeInput: '',
      published: true,
      visibility: 'member',
      description:
        'Oryantasyon kapsamında ekip tanıtımları, çalışma akışı ve görev süreçleri anlatılacaktır. Mentorluk eşleştirmeleri hafta sonu duyurulacaktır.',
      footerLeft: 'Form',
      links: [],
      imageUrl: '',
    },
    {
      id: 'a4',
      title: 'Roket Tasarım Atölyesi',
      tag: 'Etkinlik',
      tagClass: '',
      date: '2025-01-12',
      dateInput: '2025-01-12',
      timeInput: '',
      published: true,
      visibility: 'member',
      description:
        'Atölye 3 oturumdan oluşacaktır: aerodinamik, motor seçimi ve simülasyon. Katılım listesi ve materyaller toplantıdan önce paylaşılacaktır.',
      footerLeft: 'Atölye',
      links: [],
      imageUrl: '',
    },
  ],
}

const STORAGE_KEY = 'announcementsData'

const formatDateInput = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

const formatDateDisplay = (value) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day} ${month} ${year}`
}

const formatDateTimeDisplay = (item) => {
  const dateLabel = formatDateDisplay(item.dateInput || item.date)
  if (!item.timeInput) return dateLabel
  return `${dateLabel} · ${item.timeInput}`
}

const parseDateValue = (item) => {
  const value = item.dateInput || item.date
  if (!value) return null
  if (value.includes('-')) {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    if (item.timeInput && item.timeInput.includes(':')) {
      const [hours, minutes] = item.timeInput.split(':').map((part) => Number(part))
      if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        parsed.setHours(hours, minutes, 0, 0)
      }
    }
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), parsed.getHours(), parsed.getMinutes())
  }
  const parts = value.split(' ')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const monthName = parts[1].toLowerCase()
    const year = parseInt(parts[2], 10)
    const months = {
      ocak: 0,
      subat: 1,
      şubat: 1,
      mart: 2,
      nisan: 3,
      mayis: 4,
      mayıs: 4,
      haziran: 5,
      temmuz: 6,
      agustos: 7,
      ağustos: 7,
      eylul: 8,
      eylül: 8,
      ekim: 9,
      kasim: 10,
      kasım: 10,
      aralik: 11,
      aralık: 11,
    }
    const month = months[monthName]
    if (!Number.isNaN(day) && !Number.isNaN(year) && month != null) {
      const parsed = new Date(year, month, day)
      if (item.timeInput && item.timeInput.includes(':')) {
        const [hours, minutes] = item.timeInput.split(':').map((part) => Number(part))
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
          parsed.setHours(hours, minutes, 0, 0)
        }
      }
      return parsed
    }
  }
  return null
}

const getDescription = (item) => item.description || item.detail || item.summary || ''

const truncateText = (value, limit = 140) => {
  if (!value) return ''
  if (value.length <= limit) return value
  return `${value.slice(0, limit).trim()}…`
}

const truncateLabel = (value, limit = 12) => {
  if (!value) return ''
  if (value.length <= limit) return value
  return `${value.slice(0, limit).trim()}…`
}

const normalizeLinks = (item) => {
  if (Array.isArray(item.links)) return item.links
  if (item.linkUrl) {
    return [
      {
        id: `link-${item.id || Date.now()}`,
        label: item.linkLabel || '',
        url: item.linkUrl || '',
      },
    ]
  }
  return []
}

const parseTimeParts = (value) => {
  if (!value || !value.includes(':')) return { hour: '', minute: '' }
  const [hour, minute] = value.split(':')
  return { hour: hour || '', minute: minute || '' }
}

const getCountdownLabel = (item, now) => {
  if (!item.timeInput) return ''
  const target = parseDateValue(item)
  if (!target) return ''
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return ''
  const totalMinutes = Math.floor(diff / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  const parts = []
  if (days > 0) parts.push(`${days}g`)
  if (hours > 0 || days > 0) parts.push(`${hours}s`)
  parts.push(`${minutes}dk`)
  return `Kalan: ${parts.join(' ')}`
}

const normalizeRole = (value) => {
  if (value === 'admin') return 'management'
  if (value === 'publisher') return 'lead'
  if (value === 'editor') return 'member'
  return value || ''
}

const roleRank = {
  member: 1,
  lead: 2,
  management: 3,
  founder: 4,
}

const publicTags = ['Etkinlik', 'Yarışma', 'Genel']

const buildWhatsAppShare = (item) => {
  if (typeof window === 'undefined') return '#'
  const lines = [item.title || 'Duyuru', formatDateTimeDisplay(item)]
  const text = `${lines.filter(Boolean).join('\n')}\n${window.location.href}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export default function Announcements() {
  const [active, setActive] = useState(null)
  const [data, setData] = useState(DEFAULT_DATA)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [showPast, setShowPast] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Tümü')
  const [isDragOver, setIsDragOver] = useState(false)
  const [publishingId, setPublishingId] = useState(null)
  const [nowTick, setNowTick] = useState(() => new Date())
  const fileInputRef = useRef(null)
  const dateInputRef = useRef(null)

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const canEditPage =
    isLoggedIn && (userRole === 'management' || userRole === 'founder')
  const canPublish =
    isLoggedIn && (userRole === 'lead' || userRole === 'management' || userRole === 'founder')
  const canManageAnnouncements =
    isLoggedIn && (userRole === 'lead' || userRole === 'management' || userRole === 'founder')
  const getRoleRank = (role) => roleRank[role] || 0
  const canViewItem = (item) => {
    if (!isLoggedIn) {
      return publicTags.includes(item.tag)
    }
    return getRoleRank(userRole) >= getRoleRank(item.visibility || 'member')
  }
  const applyFilter = (items) =>
    activeFilter === 'Tümü'
      ? items
      : items.filter((item) => item.tag.toLowerCase() === activeFilter.toLowerCase())

  const visibleItems = data.items
    .filter((item) => canViewItem(item))
    .filter((item) => (canPublish ? true : item.published))
  const upcomingItems = applyFilter(
    visibleItems.filter((item) => {
      const dateValue = parseDateValue(item)
      if (!dateValue) return true
      return dateValue >= todayStart
    })
  )
  const pastItems = applyFilter(
    visibleItems.filter((item) => {
      const dateValue = parseDateValue(item)
      if (!dateValue) return false
      return dateValue < todayStart
    })
  )

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const normalized = {
          ...parsed,
          items: (parsed.items || []).map((item) => ({
            ...item,
            dateInput: item.dateInput || item.date,
            published: item.published ?? true,
            description: item.description || item.detail || item.summary || '',
            timeInput: item.timeInput || '',
            links: normalizeLinks(item),
            visibility: item.visibility || 'member',
          })),
        }
        normalized.items = normalized.items.map((item) => {
          if (item.dateInput && item.dateInput.includes('-')) {
            return item
          }
          const parsedDate = parseDateValue(item)
          if (!parsedDate) return item
          const iso = formatDateInput(parsedDate)
          return { ...item, dateInput: iso, date: formatDateDisplay(iso) }
        })
        setData(normalized)
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(new Date())
    }, 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!canEditPage && isEditing) {
      setIsEditing(false)
    }
  }, [canEditPage, isEditing])

  useEffect(() => {
    if (!active && !editItem) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (editItem) {
          setEditItem(null)
        } else if (active) {
          setActive(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, editItem])

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setIsEditing(false)
  }

  const handleCancel = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const normalized = {
          ...parsed,
          items: (parsed.items || []).map((item) => ({
            ...item,
            dateInput: item.dateInput || item.date,
            published: item.published ?? true,
            description: item.description || item.detail || item.summary || '',
            timeInput: item.timeInput || '',
            links: normalizeLinks(item),
            visibility: item.visibility || 'member',
          })),
        }
        normalized.items = normalized.items.map((item) => {
          if (item.dateInput && item.dateInput.includes('-')) {
            return item
          }
          const parsedDate = parseDateValue(item)
          if (!parsedDate) return item
          const iso = formatDateInput(parsedDate)
          return { ...item, dateInput: iso, date: formatDateDisplay(iso) }
        })
        setData(normalized)
      } catch {
        setData(DEFAULT_DATA)
      }
    } else {
      setData(DEFAULT_DATA)
    }
    setIsEditing(false)
  }

  const updateBanner = (field, value) => {
    setData((prev) => ({ ...prev, banner: { ...prev.banner, [field]: value } }))
  }

  const updateItem = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addItem = () => {
    const now = new Date()
    const dateInput = formatDateInput(now)
    const newItem = {
      id: `a${Date.now()}`,
      title: 'Yeni Duyuru',
      tag: 'Genel',
      tagClass: 'general',
      date: formatDateDisplay(dateInput),
      dateInput,
      timeInput: '',
      published: false,
      visibility:
        userRole === 'management' ? 'management' : userRole === 'lead' ? 'lead' : 'member',
      description: 'Açıklama',
      footerLeft: 'Bilgi',
      links: [],
      imageUrl: '',
    }
    setData((prev) => ({ ...prev, items: [newItem, ...prev.items] }))
    setEditItem(newItem)
  }

  const removeItem = (id) => {
    setData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }))
  }

  const addLink = (id) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item
        if ((item.links || []).length >= 3) return item
        return {
          ...item,
          links: [
            ...(item.links || []),
            { id: `link-${Date.now()}`, label: '', url: '' },
          ],
        }
      }),
    }))
    setEditItem((prev) => {
      if (!prev || prev.id !== id) return prev
      if ((prev.links || []).length >= 3) return prev
      return {
        ...prev,
        links: [...(prev.links || []), { id: `link-${Date.now()}`, label: '', url: '' }],
      }
    })
  }

  const updateLink = (itemId, linkId, field, value) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              links: (item.links || []).map((link) =>
                link.id === linkId ? { ...link, [field]: value } : link
              ),
            }
          : item
      ),
    }))
    setEditItem((prev) =>
      prev && prev.id === itemId
        ? {
            ...prev,
            links: (prev.links || []).map((link) =>
              link.id === linkId ? { ...link, [field]: value } : link
            ),
          }
        : prev
    )
  }

  const removeLink = (itemId, linkId) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, links: (item.links || []).filter((link) => link.id !== linkId) }
          : item
      ),
    }))
    setEditItem((prev) =>
      prev && prev.id === itemId
        ? { ...prev, links: (prev.links || []).filter((link) => link.id !== linkId) }
        : prev
    )
  }

  const publishItem = (id) => {
    setPublishingId(id)
    setData((prev) => {
      const next = {
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, published: true } : item
        ),
      }
      if (!isEditing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
    setEditItem((prev) => (prev && prev.id === id ? { ...prev, published: true } : prev))
    window.setTimeout(() => setPublishingId(null), 900)
  }

  const handleImageUpload = (id, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateItem(id, 'imageUrl', String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

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
      <div className="announcements-banner">
        <div className="announcements-banner-content">
          {isEditing ? (
            <input
              className="contact-edit-input contact-edit-input-center"
              value={data.banner.title}
              onChange={(event) => updateBanner('title', event.target.value)}
            />
          ) : (
            <h1 className="page-title">{data.banner.title}</h1>
          )}
          {isEditing ? (
            <textarea
              className="contact-edit-input contact-edit-textarea"
              value={data.banner.text}
              onChange={(event) => updateBanner('text', event.target.value)}
            />
          ) : (
            <p className="announcements-banner-text page-subtitle">{data.banner.text}</p>
          )}
        </div>
      </div>

      <div className="announcements-filters">
        {['Tümü', 'Etkinlik', 'Yarışma', 'Rapor', 'Toplantı', 'Proje', 'Genel']
          .filter((label) => isLoggedIn || publicTags.includes(label))
          .map((label) => (
            <button
              type="button"
              key={label}
              className={`announcement-filter ${activeFilter === label ? 'active' : ''}`}
              onClick={() => setActiveFilter(label)}
            >
              {label}
            </button>
          ))}
      </div>

      {canPublish && (
        <div className="announcement-add-row">
          <button type="button" className="announcement-add" onClick={addItem}>
            + Yeni duyuru oluştur
          </button>
        </div>
      )}

      <div className="announcements-section">
        <button
          type="button"
          className="announcements-section-toggle"
          onClick={() => setShowUpcoming((prev) => !prev)}
        >
          <span>Yaklaşan</span>
          <span className={`announcements-toggle-icon ${showUpcoming ? 'open' : ''}`}>▾</span>
        </button>
        {upcomingItems.length === 0 ? (
          <div className="announcements-empty">Yaklaşan duyuru bulunamadı.</div>
        ) : (
          showUpcoming && (
            <div className="announcements-grid">
              {upcomingItems.map((item, index) => (
                <article
                  className={`announcement-card ${index === 0 ? 'featured' : ''}`}
                  key={item.id}
                  onClick={() => !isEditing && setActive(item)}
                >
                  <div className="announcement-media">
                    <div className="announcement-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} />
                      ) : (
                        <span className="announcement-icon">📣</span>
                      )}
                    </div>
                    <div className="announcement-body">
                      <div className="announcement-meta">
                        <span className={`announcement-tag ${item.tagClass}`}>{item.tag}</span>
                        <span className="announcement-date">{formatDateTimeDisplay(item)}</span>
                      </div>
                      <h2>{item.title}</h2>
                      {(() => {
                        const description = getDescription(item)
                        const truncated = truncateText(description)
                        const hasMore = description.length > truncated.length
                        return (
                          <>
                            <p>{truncated}</p>
                            {hasMore && <span className="announcement-read-more">Devamını gör</span>}
                          </>
                        )
                      })()}
                      <div className="announcement-footer">
                        <div className="announcement-footer-left">
                          <span>{item.footerLeft}</span>
                          {getCountdownLabel(item, nowTick) && (
                            <span className="announcement-countdown">
                              {getCountdownLabel(item, nowTick)}
                            </span>
                          )}
                        </div>
                        {canManageAnnouncements && (
                          <div className="announcement-card-actions">
                            {!item.published && <span className="announcement-draft">Taslak</span>}
                            <button
                              type="button"
                              className="announcement-edit-btn"
                              onClick={(event) => {
                                event.stopPropagation()
                                setEditItem({ ...item, description: getDescription(item) })
                              }}
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              className="announcement-remove"
                              onClick={(event) => {
                                event.stopPropagation()
                                removeItem(item.id)
                              }}
                            >
                              Sil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </div>

      <div className="announcements-section">
        <button
          type="button"
          className="announcements-section-toggle"
          onClick={() => setShowPast((prev) => !prev)}
        >
          <span>Geçmiş</span>
          <span className={`announcements-toggle-icon ${showPast ? 'open' : ''}`}>▾</span>
        </button>
        {pastItems.length === 0 ? (
          <div className="announcements-empty">Geçmiş duyuru bulunamadı.</div>
        ) : (
          showPast && (
            <div className="announcements-grid">
              {pastItems.map((item) => (
                <article
                  className="announcement-card"
                  key={item.id}
                  onClick={() => !isEditing && setActive(item)}
                >
                  <div className="announcement-media">
                    <div className="announcement-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} />
                      ) : (
                        <span className="announcement-icon">📣</span>
                      )}
                    </div>
                    <div className="announcement-body">
                      <div className="announcement-meta">
                        <span className={`announcement-tag ${item.tagClass}`}>{item.tag}</span>
                        <span className="announcement-date">{formatDateTimeDisplay(item)}</span>
                      </div>
                      <h2>{item.title}</h2>
                      {(() => {
                        const description = getDescription(item)
                        const truncated = truncateText(description)
                        const hasMore = description.length > truncated.length
                        return (
                          <>
                            <p>{truncated}</p>
                            {hasMore && <span className="announcement-read-more">Devamını gör</span>}
                          </>
                        )
                      })()}
                      <div className="announcement-footer">
                        <div className="announcement-footer-left">
                          <span>{item.footerLeft}</span>
                          {getCountdownLabel(item, nowTick) && (
                            <span className="announcement-countdown">
                              {getCountdownLabel(item, nowTick)}
                            </span>
                          )}
                        </div>
                        {canManageAnnouncements && (
                          <div className="announcement-card-actions">
                            {!item.published && <span className="announcement-draft">Taslak</span>}
                            <button
                              type="button"
                              className="announcement-edit-btn"
                              onClick={(event) => {
                                event.stopPropagation()
                                setEditItem({ ...item, description: getDescription(item) })
                              }}
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              className="announcement-remove"
                              onClick={(event) => {
                                event.stopPropagation()
                                removeItem(item.id)
                              }}
                            >
                              Sil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </div>

      {editItem && (
        <div className="announcement-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="announcement-modal" onClick={(event) => event.stopPropagation()}>
            <div className="announcement-modal-topbar announcement-modal-topbar-edit">
            <div className="announcement-modal-meta">
              <span className="announcement-modal-date">{formatDateTimeDisplay(editItem)}</span>
              <span className={`announcement-tag ${editItem.tagClass}`}>{editItem.tag}</span>
            </div>
            </div>
            <div className="announcement-edit-wrapper">
              <div className="announcement-edit-fields">
              <div className="contact-edit-block">
                <label className="contact-edit-label">Başlık</label>
                <input
                  className="contact-edit-input"
                  value={editItem.title}
                  onChange={(event) => {
                    updateItem(editItem.id, 'title', event.target.value)
                    setEditItem((prev) => ({ ...prev, title: event.target.value }))
                  }}
                />
              </div>
              <div className="contact-edit-block">
                <label className="contact-edit-label">Etiket</label>
                {(() => {
                  const baseTags = ['Etkinlik', 'Toplantı', 'Yarışma', 'Rapor', 'Proje', 'Genel']
                  const isCustom = editItem.tag && !baseTags.includes(editItem.tag)
                  const deriveClass = (tag) => {
                    if (tag === 'Proje') return 'project'
                    if (tag === 'Genel') return 'general'
                    return ''
                  }
                  return (
                    <div className="announcement-tag-row">
                      <select
                        className="contact-edit-input contact-edit-select"
                        value={editItem.tag}
                        onChange={(event) => {
                          const nextTag = event.target.value
                          updateItem(editItem.id, 'tag', nextTag)
                          updateItem(editItem.id, 'tagClass', deriveClass(nextTag))
                          setEditItem((prev) => ({
                            ...prev,
                            tag: nextTag,
                            tagClass: deriveClass(nextTag),
                          }))
                        }}
                      >
                        <option value="Etkinlik">Etkinlik</option>
                        <option value="Toplantı">Toplantı</option>
                        <option value="Yarışma">Yarışma</option>
                        <option value="Rapor">Rapor</option>
                        <option value="Proje">Proje</option>
                        <option value="Genel">Genel</option>
                        {isCustom && <option value={editItem.tag}>Özel: {editItem.tag}</option>}
                      </select>
                      <input
                        className="contact-edit-input announcement-tag-input"
                        value={isCustom ? editItem.tag : ''}
                        onChange={(event) => {
                          const nextTag = event.target.value
                          updateItem(editItem.id, 'tag', nextTag)
                          updateItem(editItem.id, 'tagClass', '')
                          setEditItem((prev) => ({ ...prev, tag: nextTag, tagClass: '' }))
                        }}
                        placeholder="Yeni etiket"
                      />
                    </div>
                  )
                })()}
              </div>
              <div className="contact-edit-block">
                <label className="contact-edit-label">Tarih</label>
                <div className="announcement-date-row">
                  <input
                    className="contact-edit-input"
                    value={editItem.dateInput || ''}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      updateItem(editItem.id, 'dateInput', nextValue)
                      updateItem(editItem.id, 'date', formatDateDisplay(nextValue))
                      setEditItem((prev) => ({
                        ...prev,
                        dateInput: nextValue,
                        date: formatDateDisplay(nextValue),
                      }))
                    }}
                    type="date"
                    ref={dateInputRef}
                    onClick={() => {
                      if (dateInputRef.current?.showPicker) {
                        dateInputRef.current.showPicker()
                      }
                    }}
                  />
                  {(() => {
                    const { hour, minute } = parseTimeParts(editItem.timeInput)
                    const hours = Array.from({ length: 24 }, (_, index) =>
                      String(index).padStart(2, '0')
                    )
                    const minutes = Array.from({ length: 60 }, (_, index) =>
                      String(index).padStart(2, '0')
                    )
                    const updateTime = (nextHour, nextMinute) => {
                      if (!nextHour && !nextMinute) {
                        updateItem(editItem.id, 'timeInput', '')
                        setEditItem((prev) => ({ ...prev, timeInput: '' }))
                        return
                      }
                      const safeHour = nextHour || '00'
                      const safeMinute = nextMinute || '00'
                      const nextValue = `${safeHour}:${safeMinute}`
                      updateItem(editItem.id, 'timeInput', nextValue)
                      setEditItem((prev) => ({ ...prev, timeInput: nextValue }))
                    }
                    return (
                      <div className="announcement-time-selects">
                        <select
                          className="contact-edit-input contact-edit-select announcement-time-select"
                          value={hour}
                          onChange={(event) => updateTime(event.target.value, minute)}
                        >
                          <option value="">Saat</option>
                          {hours.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                        <span className="announcement-time-separator">:</span>
                        <select
                          className="contact-edit-input contact-edit-select announcement-time-select"
                          value={minute}
                          onChange={(event) => updateTime(hour, event.target.value)}
                        >
                          <option value="">Dakika</option>
                          {minutes.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })()}
                </div>
              </div>
              <div className="contact-edit-block">
                <label className="contact-edit-label">Alt bilgi</label>
                <input
                  className="contact-edit-input"
                  value={editItem.footerLeft}
                  onChange={(event) => {
                    updateItem(editItem.id, 'footerLeft', event.target.value)
                    setEditItem((prev) => ({ ...prev, footerLeft: event.target.value }))
                  }}
                />
              </div>
              {canManageAnnouncements && (
                <div className="contact-edit-block">
                  <label className="contact-edit-label">Görünürlük</label>
                  <select
                    className="contact-edit-input contact-edit-select"
                    value={editItem.visibility || 'member'}
                    onChange={(event) => {
                      updateItem(editItem.id, 'visibility', event.target.value)
                      setEditItem((prev) => ({ ...prev, visibility: event.target.value }))
                    }}
                  >
                    <option value="member">Üye</option>
                    <option value="lead">Ekip Lideri</option>
                    <option value="management">Yönetim</option>
                  </select>
                </div>
              )}
              <div className="contact-edit-block announcement-edit-span">
                <label className="contact-edit-label">Bağlantılar</label>
                <div className="announcement-links">
                  {(editItem.links || []).map((link) => (
                    <div className="announcement-link-row" key={link.id}>
                      <input
                        className="contact-edit-input"
                        value={link.label}
                        onChange={(event) =>
                          updateLink(editItem.id, link.id, 'label', event.target.value)
                        }
                        maxLength={12}
                        placeholder="Bağlantı metni"
                      />
                      <input
                        className="contact-edit-input"
                        value={link.url}
                        onChange={(event) =>
                          updateLink(editItem.id, link.id, 'url', event.target.value)
                        }
                        placeholder="https://"
                      />
                      <button
                        type="button"
                        className="announcement-link-remove"
                        onClick={() => removeLink(editItem.id, link.id)}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="announcement-link-add"
                    onClick={() => addLink(editItem.id)}
                    disabled={(editItem.links || []).length >= 3}
                  >
                    + Bağlantı ekle
                  </button>
                </div>
              </div>
              <div className="contact-edit-block announcement-edit-span">
                <label className="contact-edit-label">Görsel URL</label>
                <input
                  className="contact-edit-input"
                  value={editItem.imageUrl}
                  onChange={(event) => {
                    updateItem(editItem.id, 'imageUrl', event.target.value)
                    setEditItem((prev) => ({ ...prev, imageUrl: event.target.value }))
                  }}
                />
              </div>
              <div className="contact-edit-block announcement-edit-span">
                <label className="contact-edit-label">Görsel yükle</label>
                <div
                  className={`announcement-dropzone ${isDragOver ? 'active' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDragOver(false)
                    handleImageUpload(editItem.id, event.dataTransfer.files?.[0])
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>Görseli buraya sürükleyin veya tıklayıp seçin</span>
                </div>
                <input
                  className="announcement-file"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(event) => handleImageUpload(editItem.id, event.target.files?.[0])}
                />
              </div>
              <div className="contact-edit-block announcement-edit-span">
                <label className="contact-edit-label">Açıklama</label>
                <textarea
                  className="contact-edit-input contact-edit-textarea"
                  value={editItem.description}
                  onChange={(event) => {
                    updateItem(editItem.id, 'description', event.target.value)
                    setEditItem((prev) => ({ ...prev, description: event.target.value }))
                  }}
                />
              </div>
              </div>
            </div>
            <div className="announcement-modal-footer">
              {canPublish && editItem.published && (
                <span className="announcement-status">Yayında</span>
              )}
              <div className="announcement-modal-actions">
                {canPublish && !editItem.published && (
                  <button
                    type="button"
                    className={`announcement-modal-btn announcement-publish ${
                      publishingId === editItem.id ? 'is-publishing' : ''
                    }`}
                    onClick={() => publishItem(editItem.id)}
                  >
                    Yayınla
                  </button>
                )}
                <button
                  className="announcement-modal-btn announcement-modal-close"
                  onClick={() => setEditItem(null)}
                >
                  İptal et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {active && (
        <div className="announcement-modal-overlay" onClick={() => setActive(null)}>
          <div className="announcement-modal" onClick={(event) => event.stopPropagation()}>
            <div className="announcement-modal-header">
              <h2 className="announcement-modal-title">{active.title}</h2>
              <button
                className="announcement-modal-btn announcement-modal-close announcement-modal-close-top"
                onClick={() => setActive(null)}
                aria-label="Kapat"
                title="Kapat"
              >
                Kapat
              </button>
            </div>
            <div className="announcement-modal-meta">
              <span className="announcement-modal-date">{formatDateTimeDisplay(active)}</span>
              <span className={`announcement-tag ${active.tagClass}`}>{active.tag}</span>
            </div>
            <p>{getDescription(active)}</p>
            {active.links && active.links.length > 0 && (
              <div className="announcement-modal-actions announcement-modal-actions-align announcement-modal-actions-links">
                {active.links
                  .filter((link) => link.url && link.label)
                  .map((link) => (
                    <a
                      key={link.id}
                      className="announcement-modal-btn announcement-link-btn"
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {truncateLabel(link.label)}
                    </a>
                  ))}
              </div>
            )}
            <div className="announcement-modal-actions announcement-modal-actions-align announcement-modal-actions-links">
              <a
                className="announcement-modal-btn announcement-link-btn announcement-whatsapp-btn"
                href={buildWhatsAppShare(active)}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                WhatsApp'ta Paylaş
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
