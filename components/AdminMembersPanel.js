'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LottieLoader from './LottieLoader'

const LOADER_SRC = '/lottie/space%20boy%20developer.json'

  const roleOptions = [
    { value: 'founder', label: 'Kurucu', disabled: true },
    { value: 'guest', label: 'Misafir' },
    { value: 'member', label: 'Üye' },
    { value: 'lead', label: 'Ekip Lideri' },
    { value: 'management', label: 'Yönetim' },
  ]

  const roleLabels = {
    founder: 'Kurucu',
    guest: 'Misafir',
    member: 'Üye',
    lead: 'Ekip Lideri',
    management: 'Yönetim',
  }

export default function AdminMembersPanel({ mode }) {
  const [isAllowed, setIsAllowed] = useState(false)
  const [canManageMembers, setCanManageMembers] = useState(false)
  const [members, setMembers] = useState([])
  const [query, setQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingId, setEditingId] = useState('')
  const [openMemberIds, setOpenMemberIds] = useState(new Set())
  const [editDraft, setEditDraft] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const normalizeUrl = (value) => {
    if (!value) return ''
    return value.startsWith('http') ? value : `https://${value}`
  }

  useEffect(() => {
    const role = localStorage.getItem('demoRole') || ''
    const canView = role === 'management' || role === 'founder' || role === 'lead'
    if (!canView) {
      router.replace('/profile')
      return
    }
    setCanManageMembers(role === 'management' || role === 'founder')
    setIsAllowed(true)
    const fetchMembers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/members')
        if (!response.ok) return
        const data = await response.json()
        setMembers(Array.isArray(data) ? data : [])
      } catch {}
      finally {
        setIsLoading(false)
      }
    }
    fetchMembers()
  }, [router])

  const updateMember = async (id, updates) => {
    if (!canManageMembers) return
    if (updates.role === 'founder') {
      return
    }
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) return
      const updated = await response.json()
      setMembers((prev) =>
        prev.map((member) => (member.id === id ? updated : member))
      )
      const currentUserId = localStorage.getItem('demoUserId') || ''
      if (currentUserId && currentUserId === id) {
        if (updated.role) {
          localStorage.setItem('demoRole', updated.role)
        }
        if (updated.status) {
          localStorage.setItem('demoProfileStatus', updated.status)
        }
        window.dispatchEvent(new Event('demoAuthChanged'))
      }
    } catch {}
  }

  const removeMember = async (id) => {
    if (!canManageMembers) return
    try {
      const response = await fetch(`/api/members/${id}`, { method: 'DELETE' })
      if (!response.ok) return
      setMembers((prev) => prev.filter((member) => member.id !== id))
    } catch {}
  }

  const startEdit = (member) => {
    if (!canManageMembers) return
    setOpenMemberIds((prev) => new Set(prev).add(member.id))
    setEditingId(member.id)
    setEditDraft({
      phone: member.phone || '',
      title: member.title || '',
      memberStart: member.memberStart || '',
      memberEnd: member.memberEnd || '',
      role: member.role || 'member',
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditDraft({})
  }

  const saveEdit = async (member) => {
    const payload = {}
    const nextRole = editDraft.role || member.role || 'member'
    if (nextRole !== (member.role || 'member')) {
      payload.role = nextRole
    }
    const nextTitle = editDraft.title || ''
    if (nextTitle !== (member.title || '')) {
      payload.title = nextTitle
    }
    const nextPhone = editDraft.phone || ''
    if (nextPhone !== (member.phone || '')) {
      payload.phone = nextPhone
    }
    const nextStart = editDraft.memberStart || ''
    if (nextStart !== (member.memberStart || '')) {
      payload.memberStart = nextStart
    }
    const nextEnd = editDraft.memberEnd || ''
    if (nextEnd !== (member.memberEnd || '')) {
      payload.memberEnd = nextEnd
    }
    await updateMember(member.id, payload)
    cancelEdit()
  }

  const updateDraft = (field, value) => {
    setEditDraft((prev) => ({ ...prev, [field]: value }))
  }

  if (!isAllowed) {
    return null
  }

  const filteredMembers = members.filter((member) => {
    const memberStatus = member.status || 'pending'
    if (mode === 'approvals' && memberStatus !== 'pending') {
      return false
    }
    if (mode === 'members' && activeOnly && member.memberEnd !== 'active') {
      return false
    }
    if (mode === 'members' && roleFilter !== 'all' && member.role !== roleFilter) {
      return false
    }
    if (!query.trim()) return true
    const haystack = `${member.firstName || ''} ${member.lastName || ''} ${
      member.email || ''
    }`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const pendingCount = members.filter((member) => member.status === 'pending').length

  return (
    <div className="page">
      <div className="admin-card admin-portal-card-wrap">
        <div className="admin-panel-header">
          <div className="admin-panel-title">
            <Link href="/admin" className="admin-filter admin-filter-pill admin-back-link">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15.5 4 7.5 12l8 8 1.4-1.4L10.3 12l6.6-6.6L15.5 4z" />
              </svg>
              Yönetim Paneli
            </Link>
            <h1>{mode === 'approvals' ? 'Bekleyen Onaylar' : 'Tüm Üyeler'}</h1>
          </div>
          <span className="admin-panel-count">
            {mode === 'approvals' ? pendingCount : members.length}
          </span>
        </div>
        <p className="admin-subtitle">
          {mode === 'approvals'
            ? 'Onay bekleyen üyeler'
            : 'Üye listesi ve hızlı düzenlemeler'}
        </p>
        <div className="admin-filters">
          {mode === 'members' && (
            <></>
          )}
          <div className="admin-filter-row">
            <input
              className="admin-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="İsim veya e-posta ara"
            />
            {mode === 'members' && (
              <button
                type="button"
                className={`admin-filter admin-filter-highlight admin-filter-pill ${
                  activeOnly ? 'active' : ''
                }`}
                onClick={() => setActiveOnly((prev) => !prev)}
              >
                Aktif Üyeler
              </button>
            )}
            {mode === 'members' && (
              <>
                {[
                  { id: 'member', label: 'Üye' },
                  { id: 'management', label: 'Yönetim' },
                  { id: 'lead', label: 'Ekip Lideri' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-filter admin-filter-pill ${
                      roleFilter === item.id ? 'active' : ''
                    }`}
                    onClick={() =>
                      setRoleFilter((prev) => (prev === item.id ? 'all' : item.id))
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="admin-loading admin-loading-overlay">
            <LottieLoader src={LOADER_SRC} label="Üyeler yükleniyor..." size={140} />
          </div>
        ) : members.length === 0 ? (
          <p className="admin-empty-state">Henüz üye kaydı bulunmuyor.</p>
        ) : filteredMembers.length === 0 ? (
          <p className="admin-empty-state">Filtreye uygun üye bulunamadı.</p>
        ) : (
          <div className="admin-member-list">
            {filteredMembers.map((member) => (
              <div className="admin-member-card" key={member.id}>
                <div className="admin-member-header">
                  <div className="admin-member-profile">
                    <div className="admin-member-avatar">
                      <img src={member.avatar || '/avatar-placeholder.svg'} alt="Profil" />
                    </div>
                  </div>
                  <div className="admin-member-info">
                    <h2>
                      {member.firstName} {member.lastName}
                    </h2>
                    <p>{member.email || 'E-posta yok'}</p>
                  </div>
                  <div className="admin-member-meta">
                    <span className={`profile-status-badge ${member.status || 'pending'}`}>
                      {member.status === 'approved'
                        ? 'Onaylandı'
                        : member.status === 'rejected'
                        ? 'Reddedildi'
                        : 'Onay bekliyor'}
                    </span>
                  </div>
                </div>
                {openMemberIds.has(member.id) && (
                  <div className="admin-member-lines">
                      <div className="admin-member-line">
                        <span>Topluluk Ünvanı</span>
                        {editingId === member.id ? (
                          <input
                            className="contact-edit-input admin-inline-input"
                            value={editDraft.title || ''}
                            placeholder="-"
                            onChange={(event) => updateDraft('title', event.target.value)}
                          />
                        ) : (
                          <strong>{member.title || '-'}</strong>
                        )}
                      </div>
                      <div className="admin-member-line-row">
                        <div className="admin-member-line">
                          <span>Üyelik Başlangıcı</span>
                          {editingId === member.id ? (
                            <select
                              className="contact-edit-input contact-edit-select admin-inline-input"
                              value={editDraft.memberStart || ''}
                              onChange={(event) =>
                                updateDraft('memberStart', event.target.value)
                              }
                            >
                              <option value="">Yıl</option>
                              {Array.from({ length: 61 }, (_, index) => {
                                const year = 2019 + index
                                return (
                                  <option key={year} value={String(year)}>
                                    {year}
                                  </option>
                                )
                              })}
                            </select>
                          ) : (
                            <strong>{member.memberStart || '-'}</strong>
                          )}
                        </div>
                        <div className="admin-member-line">
                          <span>Üyelik Bitişi</span>
                          {editingId === member.id ? (
                            <select
                              className="contact-edit-input contact-edit-select admin-inline-input"
                              value={editDraft.memberEnd || ''}
                              onChange={(event) => updateDraft('memberEnd', event.target.value)}
                            >
                              <option value="">Yıl</option>
                              <option value="active">Aktif Üye</option>
                              {Array.from({ length: 61 }, (_, index) => {
                                const year = 2019 + index
                                return (
                                  <option key={year} value={String(year)}>
                                    {year}
                                  </option>
                                )
                              })}
                            </select>
                          ) : (
                            <strong>{member.memberEnd || '-'}</strong>
                          )}
                        </div>
                      </div>
                      <div className="admin-member-line">
                        <span>E-posta</span>
                        <strong>{member.email || '-'}</strong>
                      </div>
                      <div className="admin-member-line">
                        <span>Telefon</span>
                        {editingId === member.id ? (
                          <input
                            className="contact-edit-input admin-inline-input"
                            value={editDraft.phone || ''}
                            onChange={(event) => updateDraft('phone', event.target.value)}
                            placeholder="-"
                          />
                        ) : (
                          <strong>{member.phone || '-'}</strong>
                        )}
                      </div>
                      <div className="admin-member-line">
                        <span>LinkedIn</span>
                        {member.linkedinUrl ? (
                          <a
                            className="admin-member-link"
                            href={normalizeUrl(member.linkedinUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Profili aç
                          </a>
                        ) : (
                          <strong>-</strong>
                        )}
                      </div>
                  </div>
                )}
                <div className="admin-member-actions">
                  {editingId === member.id ? (
                    <select
                      className="contact-edit-input contact-edit-select admin-role-select"
                      value={editDraft.role || member.role || 'member'}
                      onChange={(event) => updateDraft('role', event.target.value)}
                      disabled={member.role === 'founder'}
                    >
                      {roleOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className={`admin-role-static admin-role-${member.role || 'member'}`}
                    >
                      {roleLabels[member.role] || 'Üye'}
                    </div>
                  )}
                  {canManageMembers ? (
                    editingId === member.id ? (
                    <>
                      <button
                        type="button"
                        className="admin-save"
                        onClick={() => saveEdit(member)}
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        className="admin-cancel"
                        onClick={cancelEdit}
                      >
                        Vazgeç
                      </button>
                    </>
                    ) : (
                      <button
                        type="button"
                        className="admin-edit"
                        onClick={() => startEdit(member)}
                      >
                        Düzenle
                      </button>
                    )
                  ) : null}
                  {canManageMembers && member.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="admin-approve"
                        onClick={() => updateMember(member.id, { status: 'approved' })}
                      >
                        Onayla
                      </button>
                      <button
                        type="button"
                        className="admin-reject"
                        onClick={() => updateMember(member.id, { status: 'rejected' })}
                      >
                        Reddet
                      </button>
                    </>
                  ) : canManageMembers && mode === 'members' ? (
                    <button
                      type="button"
                      className="admin-remove"
                      onClick={() => removeMember(member.id)}
                    >
                      Üyeyi Kaldır
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="admin-member-toggle admin-member-toggle-right"
                    onClick={() =>
                      setOpenMemberIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(member.id)) {
                          next.delete(member.id)
                        } else {
                          next.add(member.id)
                        }
                        return next
                      })
                    }
                  >
                    <span>
                      {openMemberIds.has(member.id)
                        ? 'Detayları Gizle'
                        : 'Detayları Göster'}
                    </span>
                    <span
                      className={`admin-member-toggle-icon ${
                        openMemberIds.has(member.id) ? 'open' : ''
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
