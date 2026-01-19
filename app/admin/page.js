'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const MEMBERS_KEY = 'demoMembers'

const roleOptions = [
  { value: 'member', label: 'Üye' },
  { value: 'lead', label: 'Ekip Lideri' },
  { value: 'management', label: 'Yönetim' },
]

const loadMembers = () => {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function Admin() {
  const [isAllowed, setIsAllowed] = useState(false)
  const [members, setMembers] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('approvals')
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('demoRole') || ''
    if (role !== 'management') {
      router.replace('/profile')
      return
    }
    setIsAllowed(true)
    setMembers(loadMembers())
  }, [router])

  const persistMembers = (next) => {
    setMembers(next)
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(next))
  }

  const updateMember = (id, updates) => {
    const next = members.map((member) =>
      member.id === id ? { ...member, ...updates } : member
    )
    persistMembers(next)
    const currentUserId = localStorage.getItem('demoUserId') || ''
    if (currentUserId && currentUserId === id) {
      if (updates.role) {
        localStorage.setItem('demoRole', updates.role)
      }
      if (updates.status) {
        localStorage.setItem('demoProfileStatus', updates.status)
      }
      window.dispatchEvent(new Event('demoAuthChanged'))
    }
  }

  if (!isAllowed) {
    return null
  }

  const filteredMembers = members.filter((member) => {
    if (activeTab === 'approvals' && (member.status || 'pending') !== 'pending') {
      return false
    }
    if (statusFilter !== 'all' && (member.status || 'pending') !== statusFilter) {
      return false
    }
    if (!query.trim()) return true
    const haystack = `${member.firstName || ''} ${member.lastName || ''} ${
      member.email || ''
    }`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const removeMember = (id) => {
    const next = members.filter((member) => member.id !== id)
    persistMembers(next)
  }

  return (
    <div className="page">
      <div className="admin-card">
        <h1>Üyelik Onayı</h1>
        <p className="admin-subtitle">Tüm Üyeler</p>
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            Üyelik Onayı
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Tüm Üyeler
          </button>
        </div>
        <div className="admin-filters">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'pending', label: 'Bekleyen' },
            { id: 'approved', label: 'Onaylı' },
            { id: 'rejected', label: 'Reddedildi' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-filter ${statusFilter === item.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
          <input
            className="admin-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="İsim veya e-posta ara"
          />
        </div>
        {members.length === 0 ? (
          <p>Henüz üye kaydı bulunmuyor.</p>
        ) : filteredMembers.length === 0 ? (
          <p>Filtreye uygun üye bulunamadı.</p>
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
                    <div className="admin-member-lines">
                      <div className="admin-member-line">
                        <span>Telefon</span>
                        <strong>{member.phone || '-'}</strong>
                      </div>
                      <div className="admin-member-line">
                        <span>Topluluk Ünvanı</span>
                        <strong>{member.title || '-'}</strong>
                      </div>
                      <div className="admin-member-line">
                        <span>Başlangıç</span>
                        <strong>{member.memberStart || '-'}</strong>
                      </div>
                      <div className="admin-member-line">
                        <span>Sonlanma</span>
                        <strong>{member.memberEnd || '-'}</strong>
                      </div>
                    </div>
                  </div>
                  <span className={`profile-status-badge ${member.status || 'pending'}`}>
                    {member.status === 'approved'
                      ? 'Onaylandı'
                      : member.status === 'rejected'
                      ? 'Reddedildi'
                      : 'Onay bekliyor'}
                  </span>
                </div>
                <div className="admin-member-actions">
                  <select
                    className="contact-edit-input contact-edit-select admin-role-select"
                    value={member.role || 'member'}
                    onChange={(event) => updateMember(member.id, { role: event.target.value })}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {activeTab === 'approvals' ? (
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
                  ) : (
                    <button
                      type="button"
                      className="admin-remove"
                      onClick={() => removeMember(member.id)}
                    >
                      Üyeyi Kaldır
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
