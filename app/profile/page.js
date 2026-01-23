'use client'

import { useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import LottieLoader from '../../components/LottieLoader'

const LOADER_SRC = '/lottie/space%20boy%20developer.json'

const roleLabels = {
  guest: 'Misafir',
  founder: 'Kurucu',
  management: 'Yönetim Ekibi',
  lead: 'Ekip Lideri',
  member: 'Üye',
  academy: 'Akademi',
}

const TITLE_MIN = 2
const TITLE_MAX = 40
const TITLE_PATTERN = /^[\p{L}\p{N}\s.'-]+$/u
const BANNED_TITLE_TERMS = ['amk', 'sik', 'orospu', 'yarrak', 'salak', 'aptal', 'mal']

export default function Profile() {
  const [role, setRole] = useState('')
  const [userId, setUserId] = useState('')
  const [avatar, setAvatar] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [title, setTitle] = useState('')
  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [memberStart, setMemberStart] = useState('')
  const [memberEnd, setMemberEnd] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [approvalStatus, setApprovalStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [cropImage, setCropImage] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    title: '',
    phone: '',
    email: '',
    memberStart: '',
    memberEnd: '',
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    let isActive = true

    const applyLocalProfile = () => {
      const storedRole = localStorage.getItem('demoRole') || ''
      const storedUserId = localStorage.getItem('demoUserId') || ''
      setRole(storedRole)
      setUserId(storedUserId)
      setAvatar(localStorage.getItem('demoProfileAvatar') || '')
      setFirstName(localStorage.getItem('demoProfileName') || '')
      setLastName(localStorage.getItem('demoProfileSurname') || '')
      setTitle(localStorage.getItem('demoProfileTitle') || '')
      setPosition(localStorage.getItem('demoProfilePosition') || '')
      setCompany(localStorage.getItem('demoProfileCompany') || '')
      setLinkedinUrl(localStorage.getItem('demoProfileLinkedin') || '')
      setPhone(localStorage.getItem('demoProfilePhone') || '')
      setEmail(localStorage.getItem('demoProfileEmail') || '')
      setMemberStart(localStorage.getItem('demoProfileMemberStart') || '')
      setMemberEnd(localStorage.getItem('demoProfileMemberEnd') || '')
      setApprovalStatus(localStorage.getItem('demoProfileStatus') || 'pending')
    }

    const updateProfile = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/members/me')
        if (!response.ok) {
          if (isActive) applyLocalProfile()
          return
        }
        const data = await response.json()
        if (!isActive) return
        setRole(data.role || '')
        setUserId(data.id || '')
        setAvatar(data.avatar || localStorage.getItem('demoProfileAvatar') || '')
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setTitle(data.title || '')
        setPosition(data.position || '')
        setCompany(data.company || '')
        setLinkedinUrl(data.linkedinUrl || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setMemberStart(data.memberStart || '')
        setMemberEnd(data.memberEnd || '')
        setApprovalStatus(data.status || 'pending')
      } catch {
        if (isActive) applyLocalProfile()
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    updateProfile()
    window.addEventListener('demoAuthChanged', updateProfile)
    return () => {
      isActive = false
      window.removeEventListener('demoAuthChanged', updateProfile)
    }
  }, [])

  const handleAvatarUpload = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      if (!value) return
      setCropImage(value)
      setIsCropOpen(true)
    }
    reader.readAsDataURL(file)
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
    localStorage.setItem('demoProfileAvatar', cropped)
    setAvatar(cropped)
    setIsCropOpen(false)
    setCropImage('')
    setZoom(1)
  }

  const handleSaveProfile = async () => {
    const trimmedName = firstName.trim()
    const trimmedSurname = lastName.trim()
    const trimmedTitle = title.trim()
    const trimmedPhone = phone.trim()
    const trimmedEmail = email.trim()
    const trimmedStart = memberStart.trim()
    const trimmedEnd = memberEnd.trim()
    const emailPattern = /^\S+@\S+\.\S+$/
    const normalizedTitle = trimmedTitle.toLowerCase()
    const titleError = trimmedTitle
      ? trimmedTitle.length < TITLE_MIN || trimmedTitle.length > TITLE_MAX
        ? `Ünvan ${TITLE_MIN}-${TITLE_MAX} karakter olmalıdır.`
        : !TITLE_PATTERN.test(trimmedTitle)
        ? 'Ünvan yalnızca harf, sayı ve basit noktalama içerebilir.'
        : BANNED_TITLE_TERMS.some((term) => normalizedTitle.includes(term))
        ? 'Ünvan uygunsuz içerik içeremez.'
        : ''
      : ''
    const nextErrors = {
      firstName: trimmedName ? '' : 'İsim zorunludur.',
      lastName: trimmedSurname ? '' : 'Soyisim zorunludur.',
      title: titleError,
      phone: trimmedPhone ? '' : 'Telefon zorunludur.',
      email: !trimmedEmail
        ? 'E-posta zorunludur.'
        : emailPattern.test(trimmedEmail)
        ? ''
        : 'Geçerli e-posta girin.',
      memberStart: trimmedStart ? '' : 'Üyelik başlangıcı zorunludur.',
      memberEnd: trimmedEnd ? '' : 'Üyelik bitişi zorunludur.',
    }
    setErrors(nextErrors)
    if (
      nextErrors.firstName ||
      nextErrors.lastName ||
      nextErrors.title ||
      nextErrors.phone ||
      nextErrors.email ||
      nextErrors.memberStart ||
      nextErrors.memberEnd
    ) {
      setSaveStatus('')
      return
    }
    const payload = {
      firstName: trimmedName,
      lastName: trimmedSurname,
      title: trimmedTitle,
      position: position.trim(),
      company: company.trim(),
      linkedinUrl: linkedinUrl.trim(),
      phone: trimmedPhone,
      email: trimmedEmail,
      memberStart,
      memberEnd,
      avatar,
    }

    try {
      const response = await fetch('/api/members/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        let errorMessage = 'Profil kaydedilemedi.'
        try {
          const errorBody = await response.json()
          if (errorBody?.message) {
            errorMessage = errorBody.message
          }
          if (errorBody?.error === 'title_invalid') {
            setErrors((prev) => ({ ...prev, title: errorBody.message || 'Ünvan geçersiz.' }))
          }
        } catch {}
        setSaveStatus(errorMessage)
        return
      }
      const data = await response.json()
      setApprovalStatus(data.status || 'pending')
      setSaveStatus('Profil güncellendi.')

      localStorage.setItem('demoProfileName', data.firstName || trimmedName)
      localStorage.setItem('demoProfileSurname', data.lastName || trimmedSurname)
      if (data.status === 'approved') {
        localStorage.setItem('demoProfileTitle', data.title || trimmedTitle)
      } else {
        localStorage.removeItem('demoProfileTitle')
      }
      localStorage.setItem('demoProfilePosition', data.position || position.trim())
      localStorage.setItem('demoProfileCompany', data.company || company.trim())
      localStorage.setItem('demoProfileLinkedin', data.linkedinUrl || linkedinUrl.trim())
      localStorage.setItem('demoProfilePhone', data.phone || trimmedPhone)
      localStorage.setItem('demoProfileEmail', data.email || trimmedEmail)
      localStorage.setItem('demoProfileMemberStart', data.memberStart || memberStart)
      localStorage.setItem('demoProfileMemberEnd', data.memberEnd || memberEnd)
      localStorage.setItem('demoProfileStatus', data.status || 'pending')
      if (data.avatar) {
        localStorage.setItem('demoProfileAvatar', data.avatar)
      }
      if (data.role) {
        localStorage.setItem('demoRole', data.role)
      }
      window.dispatchEvent(new Event('demoAuthChanged'))
    } catch {
      setSaveStatus('Profil kaydedilemedi.')
    }
  }

  const displayTitle = approvalStatus === 'approved' ? title : ''

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <div className="profile-card-header profile-card-header-row">
          <button
            type="button"
            className="profile-avatar profile-avatar-circle"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src={avatar || '/avatar-placeholder.svg'} alt="Profil" />
          </button>
          <div className="profile-header-text">
            <h1>Profil</h1>
            <p>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'İsim Soyisim'}
            </p>
            <span className="profile-subtitle">{displayTitle || 'Ünvan'}</span>
            <span className="profile-hint">Profil fotoğrafı yüklemek için görsele tıklayın.</span>
          </div>
        </div>
        <div className="profile-card-body">
          <div className="profile-status-card">
            <span>Onay Durumu</span>
            <strong className={`profile-status-badge ${approvalStatus}`}>
              {approvalStatus === 'approved'
                ? 'Onaylandı'
                : approvalStatus === 'rejected'
                ? 'Reddedildi'
                : 'Onay bekliyor'}
            </strong>
          </div>
        {isLoading && (
          <div className="admin-loading admin-loading-overlay">
            <LottieLoader src={LOADER_SRC} label="Profil yükleniyor..." size={160} />
          </div>
        )}
          <p className="profile-section-label">Kişisel Bilgiler</p>
          <div className="profile-row profile-row-input profile-field profile-row-two">
            <div className="profile-row-inline">
              <span>İsim</span>
              <div className="profile-input-wrap">
                {errors.firstName && <em className="profile-error">{errors.firstName}</em>}
                <input
                  className="contact-edit-input profile-input"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value)
                    setErrors((prev) => ({ ...prev, firstName: '' }))
                  }}
                  placeholder="İsim"
                />
              </div>
            </div>
            <div className="profile-row-inline">
              <span>Soyisim</span>
              <div className="profile-input-wrap">
                {errors.lastName && <em className="profile-error">{errors.lastName}</em>}
                <input
                  className="contact-edit-input profile-input"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value)
                    setErrors((prev) => ({ ...prev, lastName: '' }))
                  }}
                  placeholder="Soyisim"
                />
              </div>
            </div>
          </div>
          <div className="profile-row profile-row-input profile-field profile-row-two">
            <div className="profile-row-inline">
              <span>E-posta</span>
              <div className="profile-input-wrap">
                {errors.email && <em className="profile-error">{errors.email}</em>}
                <input
                  className="contact-edit-input profile-input"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  placeholder="ornek@mail.com"
                  inputMode="email"
                  readOnly
                />
              </div>
            </div>
            <div className="profile-row-inline">
              <span>Telefon</span>
              <div className="profile-input-wrap">
                {errors.phone && <em className="profile-error">{errors.phone}</em>}
                <input
                  className="contact-edit-input profile-input"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value)
                    setErrors((prev) => ({ ...prev, phone: '' }))
                  }}
                  placeholder="05xx xxx xx xx"
                  inputMode="tel"
                />
              </div>
            </div>
          </div>
          <div className="profile-section-separator" />
          <p className="profile-section-label">Üyelik ve Topluluk</p>
          <div className="profile-row profile-row-input profile-field profile-row-two">
            <div className="profile-row-inline">
              <span>Üyelik Başlangıcı</span>
              <div className="profile-input-wrap">
                {errors.memberStart && (
                  <em className="profile-error">{errors.memberStart}</em>
                )}
                <select
                  className="contact-edit-input contact-edit-select profile-input"
                  value={memberStart}
                  onChange={(event) => {
                    setMemberStart(event.target.value)
                    setErrors((prev) => ({ ...prev, memberStart: '' }))
                  }}
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
              </div>
            </div>
            <div className="profile-row-inline">
              <span>Üyelik Bitişi</span>
              <div className="profile-input-wrap">
                {errors.memberEnd && <em className="profile-error">{errors.memberEnd}</em>}
                <select
                  className="contact-edit-input contact-edit-select profile-input"
                  value={memberEnd}
                  onChange={(event) => {
                    setMemberEnd(event.target.value)
                    setErrors((prev) => ({ ...prev, memberEnd: '' }))
                  }}
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
              </div>
            </div>
          </div>
          <div className="profile-row profile-row-input profile-field">
            <span>Topluluk Ünvanı</span>
            <div className="profile-input-wrap">
              {errors.title && <em className="profile-error">{errors.title}</em>}
              <input
                className="contact-edit-input profile-input"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setErrors((prev) => ({ ...prev, title: '' }))
                }}
                placeholder="Topluluk Ünvanı"
              />
            </div>
          </div>
          <div className="profile-section-separator" />
          <p className="profile-section-label">Profesyonel Bilgiler</p>
          <div className="profile-row profile-row-input profile-field">
            <span>Firma</span>
            <div className="profile-input-wrap">
              <input
                className="contact-edit-input profile-input"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Örn: Gazi Uzay"
              />
            </div>
          </div>
          <div className="profile-row profile-row-input profile-field">
            <span>Güncel Pozisyon</span>
            <div className="profile-input-wrap">
              <input
                className="contact-edit-input profile-input"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder="Örn: Ar-Ge Mühendisi"
              />
            </div>
          </div>
          <div className="profile-row profile-row-input profile-field">
            <span>LinkedIn</span>
            <div className="profile-input-wrap">
              <input
                className="contact-edit-input profile-input"
                value={linkedinUrl}
                onChange={(event) => setLinkedinUrl(event.target.value)}
                placeholder="linkedin.com/in/kullanici"
              />
            </div>
          </div>
          {saveStatus && <p className="profile-status">{saveStatus}</p>}
        </div>
        <button type="button" className="profile-save profile-save-full" onClick={handleSaveProfile}>
          Profili Kaydet
        </button>
        {isCropOpen && (
          <div className="admin-crop-overlay" onClick={() => setIsCropOpen(false)}>
            <div
              className="admin-crop-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="admin-crop-header">
                <div>
                  <h2>Görseli Kareye Kırp</h2>
                  <p>Profil görseli kare olmalıdır.</p>
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
                <label htmlFor="profile-crop-zoom">Yakınlaştır</label>
                <input
                  id="profile-crop-zoom"
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="profile-file"
          onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
        />
      </div>
    </div>
  )
}
