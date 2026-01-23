'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Cropper from 'react-easy-crop'

const INITIAL_FORM = {
  name: '',
  description: '',
  leadId: '',
  leadName: '',
  leadTitle: '',
  leadRole: '',
  leadEmail: '',
  leadPhone: '',
  leadAvatar: '',
  imageUrl: '',
  year: '',
}

export default function ProjectCreate() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [leaderQuery, setLeaderQuery] = useState('')
  const [isLeaderOpen, setIsLeaderOpen] = useState(false)
  const [members, setMembers] = useState([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [cropImage, setCropImage] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const startYear = 2020
    const endYear = currentYear + 1
    const years = []
    for (let year = endYear; year >= startYear; year -= 1) {
      years.push(String(year))
    }
    return years
  }, [currentYear])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoadingMembers(true)
        const response = await fetch('/api/members')
        if (!response.ok) return
        const data = await response.json()
        setMembers(Array.isArray(data) ? data : [])
      } catch {}
      finally {
        setIsLoadingMembers(false)
      }
    }
    fetchMembers()
  }, [])

  const activeMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          (member.memberEnd === 'active' || member.memberEnd === '') &&
          member.status === 'approved'
      ),
    [members]
  )

  const filteredMembers = useMemo(() => {
    const query = leaderQuery.trim().toLowerCase()
    const list = query
      ? activeMembers.filter((member) => {
          const name = `${member.firstName || ''} ${member.lastName || ''}`.trim()
          const haystack = `${name} ${member.email || ''}`.toLowerCase()
          return haystack.includes(query)
        })
      : activeMembers
    return list
  }, [activeMembers, leaderQuery])

  const handleLeaderChange = (value) => {
    setLeaderQuery(value)
    setForm((prev) => ({
      ...prev,
      leadId: '',
      leadName: '',
      leadTitle: '',
      leadRole: '',
      leadEmail: '',
      leadPhone: '',
      leadAvatar: '',
    }))
  }

  const selectLeader = (member) => {
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim()
    setLeaderQuery(name || member.email || '')
    setForm((prev) => ({
      ...prev,
      leadId: member.id,
      leadName: name,
      leadTitle: member.title || '',
      leadRole: member.role || '',
      leadEmail: member.email || '',
      leadPhone: member.phone || '',
      leadAvatar: member.avatar || '',
    }))
  }

  const clearLeader = () => {
    setLeaderQuery('')
    setForm((prev) => ({
      ...prev,
      leadId: '',
      leadName: '',
      leadTitle: '',
      leadRole: '',
      leadEmail: '',
      leadPhone: '',
      leadAvatar: '',
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
    updateField('imageUrl', cropped)
    setIsCropOpen(false)
    setCropImage('')
    setZoom(1)
  }

  const trimmedDescription = form.description.trim()
  const isDescriptionValid =
    trimmedDescription.length >= 50 && trimmedDescription.length <= 170
  const isImageValid = Boolean(form.imageUrl)
  const isFormValid = Boolean(
    form.name.trim() &&
      isDescriptionValid &&
      form.leadId &&
      form.year.trim() &&
      isImageValid
  )

  const handleCreate = async () => {
    if (!isFormValid || isSaving) return
    try {
      setIsSaving(true)
      setSaveStatus('')
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          year: form.year,
          leadId: form.leadId,
          imageUrl: form.imageUrl,
        }),
      })
      if (!response.ok) {
        setSaveStatus('Kaydedilemedi.')
        return
      }
      setSaveStatus('Proje oluşturuldu.')
      setForm(INITIAL_FORM)
      setLeaderQuery('')
    } catch {
      setSaveStatus('Kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
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
            <h1>Proje Oluştur</h1>
            <p className="admin-subtitle">Yeni proje bilgilerini girin.</p>
          </div>
        </div>

        <div className="admin-team-form">
          <div className="admin-team-card">
            <h2>Proje Bilgileri</h2>
            <div className="admin-team-grid">
              <div className="contact-edit-block">
                <label className="contact-edit-label">Proje Adı</label>
                <input
                  className="contact-edit-input"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Ör: Model Uydu"
                />
              </div>
              <div className="contact-edit-block">
                <label className="contact-edit-label">Proje Yılı</label>
                <select
                  className="contact-edit-input contact-edit-select"
                  value={form.year}
                  onChange={(event) => updateField('year', event.target.value)}
                >
                  <option value="" disabled>
                    Seçiniz
                  </option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="contact-edit-block admin-project-upload">
              <label className="contact-edit-label">Proje Görseli</label>
              {isImageValid ? (
                <div className="admin-project-preview">
                  <img src={form.imageUrl} alt="Proje görseli" />
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
                          typeof reader.result === 'string' ? reader.result : ''
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
            <div className="contact-edit-block">
              <label className="contact-edit-label">Açıklama</label>
              <textarea
                className="contact-edit-input contact-edit-textarea"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Projenin kapsamını ve hedeflerini kısaca yazın."
              />
              <span
                className={`admin-team-hint ${
                  isDescriptionValid ? 'admin-team-hint-ok' : ''
                }`}
              >
                50-170 karakter ({trimmedDescription.length}/170)
              </span>
            </div>
          </div>

          <div className="admin-team-card">
            <h2>Proje Lideri</h2>
            <div className="admin-team-leader-row">
              <div className="admin-team-summary">
                <span>Seçili Lider</span>
                {form.leadName ? (
                  <div className="admin-team-selected-card">
                    <div className="admin-team-avatar-stack">
                      <div className="admin-team-result-avatar">
                        <img
                          src={form.leadAvatar || '/avatar-placeholder.svg'}
                          alt={form.leadName || 'Profil'}
                        />
                      </div>
                      <span
                        className={`admin-team-role admin-team-role-${
                          form.leadRole || 'member'
                        }`}
                      >
                        {form.leadRole === 'founder'
                          ? 'Kurucu'
                          : form.leadRole === 'management'
                          ? 'Yönetim'
                          : form.leadRole === 'lead'
                          ? 'Ekip Lideri'
                          : form.leadRole === 'member'
                          ? 'Üye'
                          : form.leadRole === 'academy'
                          ? 'Akademi'
                          : 'Misafir'}
                      </span>
                    </div>
                    <div className="admin-team-result-info">
                      <strong>{form.leadName}</strong>
                      <span>{form.leadTitle || 'Ünvan yok'}</span>
                      <div className="admin-team-contact">
                        <span>E-posta: {form.leadEmail || '-'}</span>
                        <span>Telefon: {form.leadPhone || '-'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <strong>Seçilmedi</strong>
                )}
              </div>
              <button
                type="button"
                className={form.leadName ? 'admin-team-clear' : 'admin-team-pick'}
                onClick={() => {
                  if (form.leadName) {
                    clearLeader()
                  } else {
                    setIsLeaderOpen(true)
                  }
                }}
              >
                {form.leadName ? 'Lideri Kaldır' : 'Lider Seç'}
              </button>
            </div>
          </div>

          {isLeaderOpen && (
            <div
              className="admin-team-modal-overlay"
              onClick={() => setIsLeaderOpen(false)}
            >
              <div
                className="admin-team-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="admin-team-modal-top">
                  <div>
                    <h2>Proje Lideri Seç</h2>
                    <p>Aktif üyeler arasından bir lider belirleyin.</p>
                  </div>
                  <button
                    type="button"
                    className="admin-team-modal-close"
                    onClick={() => setIsLeaderOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="contact-edit-block admin-team-search">
                  <label className="contact-edit-label">Üye Ara</label>
                  <input
                    className="contact-edit-input"
                    value={leaderQuery}
                    onChange={(event) => handleLeaderChange(event.target.value)}
                    placeholder="İsim veya e-posta yazın"
                  />
                </div>
                <div className="admin-team-results">
                  {isLoadingMembers ? (
                    <div className="admin-team-result">Yükleniyor...</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="admin-team-result">Üye bulunamadı.</div>
                  ) : (
                    filteredMembers.slice(0, 10).map((member) => {
                      const name = `${member.firstName || ''} ${
                        member.lastName || ''
                      }`.trim()
                      const title = member.title || ''
                      const role = member.role || 'member'
                      const email = member.email || ''
                      const phone = member.phone || ''
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className="admin-team-result admin-team-result-card"
                          onClick={() => {
                            selectLeader(member)
                            setIsLeaderOpen(false)
                          }}
                        >
                          <div className="admin-team-result-avatar">
                            <img
                              src={member.avatar || '/avatar-placeholder.svg'}
                              alt={name || 'Profil'}
                            />
                          </div>
                          <div className="admin-team-result-info">
                            <strong>{name || 'İsimsiz Üye'}</strong>
                            <span>{title || 'Ünvan yok'}</span>
                            <div className="admin-team-result-meta">
                              <span className={`admin-team-role admin-team-role-${role}`}>
                                {role === 'founder'
                                  ? 'Kurucu'
                                  : role === 'management'
                                  ? 'Yönetim'
                                  : role === 'lead'
                                  ? 'Ekip Lideri'
                                  : role === 'member'
                                  ? 'Üye'
                                  : role === 'academy'
                                  ? 'Akademi'
                                  : 'Misafir'}
                              </span>
                              {email && <span>{email}</span>}
                              {phone && <span>{phone}</span>}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {isCropOpen && (
            <div className="admin-crop-overlay" onClick={() => setIsCropOpen(false)}>
              <div
                className="admin-crop-modal"
                onClick={(event) => event.stopPropagation()}
              >
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
                  <label htmlFor="crop-zoom">Yakınlaştır</label>
                  <input
                    id="crop-zoom"
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

          <div className="admin-team-actions">
            <button
              type="button"
              className="admin-save"
              disabled={!isFormValid || isSaving}
              onClick={handleCreate}
            >
              {isSaving ? 'Kaydediliyor...' : 'Projeyi Oluştur'}
            </button>
            <Link href="/admin" className="admin-cancel admin-team-cancel">
              Vazgeç
            </Link>
            {saveStatus && <span className="admin-team-status">{saveStatus}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
