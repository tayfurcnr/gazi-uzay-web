'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import LottieLoader from '../../../components/LottieLoader'
import Cropper from 'react-easy-crop'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState('')
  const [draft, setDraft] = useState({})
  const [saveStatus, setSaveStatus] = useState('')
  const [openYears, setOpenYears] = useState(new Set())
  const [showMembers, setShowMembers] = useState({})
  const [members, setMembers] = useState([])
  const [memberQuery, setMemberQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [cropImage, setCropImage] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [userRole, setUserRole] = useState('')

  const roleLabel = (role) => {
    const value = (role || '').toLowerCase()
    if (value === 'founder') return 'Kurucu'
    if (value === 'management') return 'Yönetim'
    if (value === 'lead') return 'Ekip Lideri'
    if (value === 'member') return 'Üye'
    if (value === 'academy') return 'Akademi'
    if (value === 'guest') return 'Misafir'
    return value || 'Üye'
  }

  useEffect(() => {
    const role = localStorage.getItem('demoRole') || ''
    setUserRole(role)
  }, [])

  useEffect(() => {
    if (!userRole) return
    if (!['management', 'founder', 'lead'].includes(userRole)) {
      window.location.href = '/admin'
    }
  }, [userRole])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/projects')
        if (!response.ok) return
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : [])
      } catch {}
      finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members')
        if (!response.ok) return
        const data = await response.json()
        setMembers(Array.isArray(data) ? data : [])
      } catch {}
    }
    fetchMembers()
  }, [])

  const startEdit = (project) => {
    setEditingId(project.id)
    const leadId = project.lead?.id || project.leadId || ''
    const baseMemberIds = Array.isArray(project.members)
      ? project.members.map((member) => member.id)
      : []
    const memberIds = leadId
      ? Array.from(new Set([leadId, ...baseMemberIds]))
      : baseMemberIds
    const memberRoles = Array.isArray(project.members)
      ? project.members.reduce((acc, member) => {
          acc[member.id] = member.projectRole || ''
          return acc
        }, {})
      : {}
    if (leadId && !memberRoles[leadId]) {
      memberRoles[leadId] = 'Ekip Lideri'
    }
    setDraft({
      name: project.name || '',
      description: project.description || '',
      achievement: project.achievement || '',
      driveUrl: project.driveUrl || '',
      year: String(project.year || ''),
      imageUrl: project.imageUrl || '',
      leadId,
      memberIds,
      memberRoles,
    })
    setMemberQuery('')
  }

  const cancelEdit = () => {
    setEditingId('')
    setDraft({})
    setMemberQuery('')
    setIsCropOpen(false)
    setCropImage('')
  }

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const descriptionLength = useMemo(() => draft.description?.trim().length || 0, [draft])
  const isDescriptionValid = descriptionLength >= 50 && descriptionLength <= 170

  const memberMap = useMemo(() => {
    return members.reduce((acc, member) => {
      acc[member.id] = member
      return acc
    }, {})
  }, [members])

  const selectedMemberIds = Array.isArray(draft.memberIds) ? draft.memberIds : []
  const selectedMembers = useMemo(() => {
    const membersList = selectedMemberIds.map((id) => memberMap[id]).filter(Boolean)
    if (!draft.leadId) return membersList
    return membersList.sort((a, b) => {
      if (a.id === draft.leadId) return -1
      if (b.id === draft.leadId) return 1
      return 0
    })
  }, [memberMap, selectedMemberIds, draft.leadId])
  const memberRoles =
    draft.memberRoles && typeof draft.memberRoles === 'object'
      ? draft.memberRoles
      : {}

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase()
    const available = members.filter(
      (member) => member.status === 'approved' && !selectedMemberIds.includes(member.id)
    )
    if (!query) return available
    return available.filter((member) => {
      const name = `${member.firstName || ''} ${member.lastName || ''}`.trim()
      const haystack = `${name} ${member.email || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [members, memberQuery, selectedMemberIds])

  const addMember = (memberId) => {
    if (!memberId) return
    updateDraft('memberIds', [...new Set([...selectedMemberIds, memberId])])
    updateDraft('memberRoles', { ...memberRoles, [memberId]: '' })
    setMemberQuery('')
  }

  const removeMember = (memberId) => {
    const nextRoles = { ...memberRoles }
    delete nextRoles[memberId]
    updateDraft(
      'memberIds',
      selectedMemberIds.filter((id) => id !== memberId)
    )
    updateDraft('memberRoles', nextRoles)
  }

  const saveEdit = async (project) => {
    if (!draft.name?.trim() || !draft.year?.trim() || !isDescriptionValid) {
      setSaveStatus('Eksik alanlar var.')
      return
    }
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
          achievement: draft.achievement,
          driveUrl: draft.driveUrl,
          year: draft.year,
          imageUrl: draft.imageUrl,
          members: selectedMemberIds.map((userId) => ({
            userId,
            role: memberRoles[userId] || '',
          })),
        }),
      })
      if (!response.ok) {
        let message = 'Kaydedilemedi.'
        try {
          const payload = await response.json()
          if (payload?.error) {
            message = `Kaydedilemedi (${payload.error}).`
          }
        } catch {}
        setSaveStatus(message)
        return
      }
      const updated = await response.json()
      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? updated : item))
      )
      setSaveStatus('Güncellendi.')
      cancelEdit()
    } catch {
      setSaveStatus('Kaydedilemedi.')
    }
  }

  const deleteProject = async (project) => {
    const confirmed = window.confirm('Projeyi silmek istediğinize emin misiniz?')
    if (!confirmed) return
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        let message = 'Silinemedi.'
        try {
          const payload = await response.json()
          if (payload?.error) {
            message = `Silinemedi (${payload.error}).`
          }
        } catch {}
        setSaveStatus(message)
        return
      }
      setProjects((prev) => prev.filter((item) => item.id !== project.id))
      setSaveStatus('')
      cancelEdit()
    } catch {
      setSaveStatus('Silinemedi.')
    }
  }

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return projects
    return projects.filter((project) => {
      const leadName = project.lead?.name || project.lead?.email || ''
      const haystack = [
        project.name,
        project.description,
        project.achievement,
        project.year,
        leadName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [projects, searchQuery])

  const projectsByYear = useMemo(() => {
    return filteredProjects.reduce((acc, project) => {
      const key = String(project.year || 'Bilinmiyor')
      if (!acc[key]) acc[key] = []
      acc[key].push(project)
      return acc
    }, {})
  }, [filteredProjects])

  const sortedYears = useMemo(() => {
    return Object.keys(projectsByYear).sort((a, b) => Number(b) - Number(a))
  }, [projectsByYear])

  const toggleYear = (year) => {
    setOpenYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) {
        next.delete(year)
      } else {
        next.add(year)
      }
      return next
    })
  }

  const toggleMembers = (projectId) => {
    setShowMembers((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const getCroppedImage = async (imageSrc, cropPixels) => {
    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
    })
    const canvas = document.createElement('canvas')
    canvas.width = cropPixels.width
    canvas.height = cropPixels.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    )
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  const confirmCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return
    const cropped = await getCroppedImage(cropImage, croppedAreaPixels)
    updateDraft('imageUrl', cropped)
    setIsCropOpen(false)
    setCropImage('')
    setZoom(1)
  }

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
            <h1>Tüm Projeler</h1>
            <p className="admin-subtitle">Var olan projeleri düzenleyin.</p>
          </div>
          <div className="admin-panel-actions">
            <input
              className="admin-portal-search"
              placeholder="Ara"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <div className="admin-portal-pill">Portal</div>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-loading admin-loading-overlay">
            <LottieLoader
              src="/lottie/space%20boy%20developer.json"
              label="Projeler yükleniyor..."
              size={170}
              placement="center"
            />
          </div>
        ) : filteredProjects.length === 0 ? (
          <p className="admin-empty-state">Sonuç bulunamadı.</p>
        ) : (
          <div className="admin-project-years">
            {sortedYears.map((year) => {
              const yearProjects = projectsByYear[year] || []
              const isOpen = openYears.has(year)
              return (
                <div key={year} className="admin-project-year">
                  <button
                    type="button"
                    className="admin-portal-section-toggle admin-project-year-toggle"
                    onClick={() => toggleYear(year)}
                  >
                    <span>{year}</span>
                    <span className={`admin-portal-chevron ${isOpen ? 'open' : ''}`}>
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="admin-project-year-content">
                      <div className="admin-project-wrap">
                        <div className="admin-member-list admin-project-list">
                          {yearProjects.map((project) => (
                          <div
                            key={project.id}
                            className={`admin-member-card admin-project-card ${
                              editingId === project.id ? 'admin-project-card-editing' : ''
                            }`}
                          >
                          <h2 className="admin-project-title">{project.name}</h2>
                          <div className="admin-project-header">
                            <div className="admin-project-thumb">
                              {project.imageUrl ? (
                                <img src={project.imageUrl} alt={project.name || 'Proje'} />
                              ) : (
                                <div className="admin-project-thumb-empty">Görsel yok</div>
                              )}
                            </div>
                            <div className="admin-project-body">
                              <div className="admin-project-field">
                                <span className="admin-project-label">Proje Sorumlusu</span>
                                <span className="admin-project-value">
                                  {project.lead?.name || project.lead?.email || 'Bilinmiyor'}
                                </span>
                              </div>
                              {project.description && (
                                <div className="admin-project-field">
                                  <span className="admin-project-label">Açıklama</span>
                                  <span className="admin-project-summary">
                                    {project.description}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="admin-project-top-actions">
                            <button
                              type="button"
                              className="admin-project-details"
                              onClick={() => toggleMembers(project.id)}
                            >
                              {showMembers[project.id]
                                ? 'Detayları Gizle'
                                : 'Detayları Göster'}
                            </button>
                            <span className="admin-project-year-badge">{project.year}</span>
                          </div>
                          {showMembers[project.id] && (
                            <div className="admin-project-members">
                              <div className="admin-project-separator" />
                              {(project.achievement || project.driveUrl) && (
                                <div className="admin-project-achievement-row">
                                  <div className="admin-project-achievement-content">
                                    <span className="admin-project-label">Başarı</span>
                                    <span className="admin-project-value">
                                      {project.achievement || '—'}
                                    </span>
                                  </div>
                                  {project.driveUrl && (
                                    <a
                                      className="admin-project-drive-btn"
                                      href={project.driveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Drive
                                    </a>
                                  )}
                                </div>
                              )}
                              <div className="admin-project-separator" />
                              <span className="admin-project-label">Ekip Üyeleri</span>
                              <div className="admin-project-members-preview">
                                {Array.isArray(project.members) && project.members.length ? (
                                  project.members.map((member) => {
                                    const name = `${member.firstName || ''} ${
                                      member.lastName || ''
                                    }`.trim()
                                    return (
                                      <div
                                        key={member.id}
                                        className="admin-project-member-pill"
                                      >
                                        <div className="admin-project-member-pill-avatar">
                                          {member.avatar ? (
                                            <img
                                              src={member.avatar}
                                              alt={name || member.email}
                                            />
                                          ) : (
                                            <span>{(name || member.email).charAt(0)}</span>
                                          )}
                                        </div>
                                        <span className="admin-project-member-pill-name">
                                          {name || member.email}
                                        </span>
                                        {member.projectRole && (
                                          <span className="admin-project-member-pill-role">
                                            {member.projectRole}
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })
                                ) : (
                                  <span className="admin-project-member-empty">
                                    Bu projeye ekip üyesi eklenmemiş.
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {editingId === project.id ? (
                            <div className="admin-project-edit">
                              <div className="contact-edit-block admin-project-upload">
                                <label className="contact-edit-label">Proje Görseli</label>
                                {draft.imageUrl ? (
                                  <div className="admin-project-preview">
                                    <img
                                      src={draft.imageUrl}
                                      alt={draft.name || 'Proje görseli'}
                                    />
                                  </div>
                                ) : (
                                  <span className="admin-team-hint">
                                    Görsel yüklemek zorunludur.
                                  </span>
                                )}
                                <div className="admin-project-upload-row admin-project-upload-center">
                                  <label className="admin-project-upload-btn">
                                    Görsel Yükle
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(event) => {
                                        const file = event.target.files?.[0]
                                        if (!file) return
                                        const reader = new FileReader()
                                        reader.onload = () => {
                                          const result =
                                            typeof reader.result === 'string'
                                              ? reader.result
                                              : ''
                                          if (result) {
                                            setCropImage(result)
                                            setIsCropOpen(true)
                                          }
                                        }
                                        reader.readAsDataURL(file)
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                              <div className="admin-team-grid">
                                <div className="contact-edit-block">
                                  <label className="contact-edit-label">Proje Adı</label>
                                  <input
                                    className="contact-edit-input"
                                    value={draft.name}
                                    onChange={(event) => updateDraft('name', event.target.value)}
                                  />
                                </div>
                                <div className="contact-edit-block">
                                  <label className="contact-edit-label">Proje Yılı</label>
                                  <input
                                    className="contact-edit-input"
                                    value={draft.year}
                                    onChange={(event) => updateDraft('year', event.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="contact-edit-block">
                                <label className="contact-edit-label">Açıklama</label>
                                <textarea
                                  className="contact-edit-input contact-edit-textarea"
                                  value={draft.description}
                                  onChange={(event) => updateDraft('description', event.target.value)}
                                />
                                <span
                                  className={`admin-team-hint ${
                                    isDescriptionValid ? 'admin-team-hint-ok' : ''
                                  }`}
                                >
                                  50-170 karakter ({descriptionLength}/170)
                                </span>
                              </div>
                              <div className="contact-edit-block">
                                <label className="contact-edit-label">Başarı</label>
                                <textarea
                                  className="contact-edit-input contact-edit-textarea"
                                  value={draft.achievement || ''}
                                  onChange={(event) =>
                                    updateDraft('achievement', event.target.value)
                                  }
                                  placeholder="Opsiyonel"
                                />
                              </div>
                              <div className="contact-edit-block">
                                <label className="contact-edit-label">Drive Linki</label>
                                <input
                                  className="contact-edit-input"
                                  value={draft.driveUrl || ''}
                                  onChange={(event) =>
                                    updateDraft('driveUrl', event.target.value)
                                  }
                                  placeholder="Opsiyonel"
                                />
                              </div>
                              <div className="contact-edit-block">
                                <label className="contact-edit-label">Ekip Üyeleri</label>
                                <div className="admin-project-members">
                                  {selectedMembers.length ? (
                                    selectedMembers.map((member) => {
                                      const name = `${member.firstName || ''} ${
                                        member.lastName || ''
                                      }`.trim()
                                      return (
                                        <div
                                          key={member.id}
                                          className="admin-project-member-chip"
                                        >
                                          <div className="admin-project-member-avatar">
                                            {member.avatar ? (
                                              <img
                                                src={member.avatar}
                                                alt={name || member.email}
                                              />
                                            ) : (
                                              <span>{(name || member.email).charAt(0)}</span>
                                            )}
                                          </div>
                                          <span className="admin-project-member-name">
                                            {name || member.email}
                                          </span>
                                          <input
                                            className="admin-project-member-role"
                                            placeholder="Rol"
                                            value={memberRoles[member.id] || ''}
                                            onChange={(event) =>
                                              updateDraft('memberRoles', {
                                                ...memberRoles,
                                                [member.id]: event.target.value,
                                              })
                                            }
                                          />
                                          <button
                                            type="button"
                                            className="admin-project-member-remove"
                                            onClick={() => removeMember(member.id)}
                                          >
                                            Kaldır
                                          </button>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <span className="admin-project-member-empty">
                                      Henüz ekip üyesi seçilmedi.
                                    </span>
                                  )}
                                </div>
                                <div className="admin-team-search">
                                  <input
                                    className="contact-edit-input"
                                    placeholder="Üye ara..."
                                    value={memberQuery}
                                    onChange={(event) => setMemberQuery(event.target.value)}
                                  />
                                  {filteredMembers.length > 0 && (
                                    <div className="admin-team-results">
                                      {filteredMembers.slice(0, 8).map((member) => {
                                        const name = `${member.firstName || ''} ${
                                          member.lastName || ''
                                        }`.trim()
                                        const title = member.title || ''
                                        const role = roleLabel(member.role)
                                        const email = member.email || ''
                                        return (
                                          <button
                                            key={member.id}
                                            type="button"
                                            className="admin-team-result admin-team-result-card"
                                            onClick={() => addMember(member.id)}
                                          >
                                            <div className="admin-team-result-avatar">
                                              {member.avatar ? (
                                                <img
                                                  src={member.avatar}
                                                  alt={name || email}
                                                />
                                              ) : (
                                                <span>{(name || email).charAt(0)}</span>
                                              )}
                                            </div>
                                            <div className="admin-team-result-info">
                                              <strong>{name || email}</strong>
                                              {title && <span>{title}</span>}
                                              <div className="admin-team-result-meta">
                                                <span>{role}</span>
                                                {email && <span>{email}</span>}
                                              </div>
                                            </div>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="admin-team-actions">
                                <button
                                  type="button"
                                  className="admin-save"
                                  onClick={() => saveEdit(project)}
                                >
                                  Kaydet
                                </button>
                                <button
                                  type="button"
                                  className="admin-cancel"
                                  onClick={() => deleteProject(project)}
                                >
                                  Sil
                                </button>
                                <button type="button" className="admin-cancel" onClick={cancelEdit}>
                                  Vazgeç
                                </button>
                                {saveStatus && (
                                  <span className="admin-team-status">{saveStatus}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="admin-project-desc">
                              <button
                                type="button"
                                className="admin-edit"
                                onClick={() => startEdit(project)}
                              >
                                Düzenle
                              </button>
                            </div>
                          )}
                          </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {isCropOpen && (
        <div className="admin-crop-overlay" onClick={() => setIsCropOpen(false)}>
          <div className="admin-crop-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-crop-header">
              <div>
                <h2>Görseli Kareye Kırp</h2>
                <p>Proje görseli kare olmalıdır.</p>
              </div>
              <button
                type="button"
                className="admin-team-modal-close"
                onClick={() => setIsCropOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="admin-crop-area">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="admin-crop-controls">
              <label htmlFor="crop-zoom-edit">Yakınlaştır</label>
              <input
                id="crop-zoom-edit"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </div>
            <div className="admin-team-actions">
              <button type="button" className="admin-save" onClick={confirmCrop}>
                Kırp ve Kaydet
              </button>
              <button
                type="button"
                className="admin-cancel"
                onClick={() => setIsCropOpen(false)}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
