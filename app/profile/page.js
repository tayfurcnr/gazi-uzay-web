'use client'

import { useEffect, useRef, useState } from 'react'

const roleLabels = {
  guest: 'Misafir',
  founder: 'Kurucu',
  management: 'Yönetim Ekibi',
  lead: 'Ekip Lideri',
  member: 'Üye',
}

const MEMBERS_KEY = 'demoMembers'

const loadMembers = () => {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const upsertMember = (members, next) => {
  const index = members.findIndex((member) => member.id === next.id)
  if (index >= 0) {
    const copy = [...members]
    copy[index] = { ...copy[index], ...next }
    return copy
  }
  return [...members, next]
}

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
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [memberStart, setMemberStart] = useState('')
  const [memberEnd, setMemberEnd] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [approvalStatus, setApprovalStatus] = useState('')
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    memberStart: '',
    memberEnd: '',
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    const updateProfile = () => {
      const storedRole = localStorage.getItem('demoRole') || ''
      let storedUserId = localStorage.getItem('demoUserId') || ''
      if (!storedUserId) {
        storedUserId = window.crypto?.randomUUID?.() || `user-${Date.now()}`
        localStorage.setItem('demoUserId', storedUserId)
      }
      const avatarKey = `demoAvatar:${storedUserId}`
      setRole(storedRole)
      setUserId(storedUserId)
      setAvatar(localStorage.getItem(avatarKey) || '')
      const members = loadMembers()
      const member = members.find((item) => item.id === storedUserId)
      setFirstName(member?.firstName || localStorage.getItem('demoProfileName') || '')
      setLastName(member?.lastName || localStorage.getItem('demoProfileSurname') || '')
      setTitle(member?.title || localStorage.getItem('demoProfileTitle') || '')
      setPosition(member?.position || localStorage.getItem('demoProfilePosition') || '')
      setCompany(member?.company || localStorage.getItem('demoProfileCompany') || '')
      setLinkedinUrl(member?.linkedinUrl || localStorage.getItem('demoProfileLinkedin') || '')
      setGender(member?.gender || localStorage.getItem('demoProfileGender') || '')
      setPhone(member?.phone || localStorage.getItem('demoProfilePhone') || '')
      setEmail(member?.email || localStorage.getItem('demoProfileEmail') || '')
      setMemberStart(member?.memberStart || localStorage.getItem('demoProfileMemberStart') || '')
      setMemberEnd(member?.memberEnd || localStorage.getItem('demoProfileMemberEnd') || '')
      setApprovalStatus(member?.status || localStorage.getItem('demoProfileStatus') || 'pending')
    }
    updateProfile()
    window.addEventListener('demoAuthChanged', updateProfile)
    return () => window.removeEventListener('demoAuthChanged', updateProfile)
  }, [])

  const handleAvatarUpload = (file) => {
    if (!file || !userId) return
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      const avatarKey = `demoAvatar:${userId}`
      localStorage.setItem(avatarKey, value)
      setAvatar(value)
      try {
        const raw = localStorage.getItem(MEMBERS_KEY)
        const members = raw ? JSON.parse(raw) : []
        if (Array.isArray(members)) {
          const next = members.map((member) =>
            member.id === userId ? { ...member, avatar: value } : member
          )
          localStorage.setItem(MEMBERS_KEY, JSON.stringify(next))
        }
      } catch {}
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    const trimmedName = firstName.trim()
    const trimmedSurname = lastName.trim()
    const trimmedPhone = phone.trim()
    const trimmedEmail = email.trim()
    const trimmedStart = memberStart.trim()
    const trimmedEnd = memberEnd.trim()
    const emailPattern = /^\S+@\S+\.\S+$/
    const nextErrors = {
      firstName: trimmedName ? '' : 'İsim zorunludur.',
      lastName: trimmedSurname ? '' : 'Soyisim zorunludur.',
      phone: trimmedPhone ? '' : 'Telefon zorunludur.',
      email: !trimmedEmail
        ? 'E-posta zorunludur.'
        : emailPattern.test(trimmedEmail)
        ? ''
        : 'Geçerli e-posta girin.',
      memberStart: trimmedStart ? '' : 'Başlangıç zorunludur.',
      memberEnd: trimmedEnd ? '' : 'Sonlanma zorunludur.',
    }
    setErrors(nextErrors)
    if (
      nextErrors.firstName ||
      nextErrors.lastName ||
      nextErrors.phone ||
      nextErrors.email ||
      nextErrors.memberStart ||
      nextErrors.memberEnd
    ) {
      setSaveStatus('')
      return
    }
    localStorage.setItem('demoProfileName', trimmedName)
    localStorage.setItem('demoProfileSurname', trimmedSurname)
    localStorage.setItem('demoProfileTitle', title.trim())
    localStorage.setItem('demoProfilePosition', position.trim())
    localStorage.setItem('demoProfileCompany', company.trim())
    localStorage.setItem('demoProfileLinkedin', linkedinUrl.trim())
    localStorage.setItem('demoProfileGender', gender)
    localStorage.setItem('demoProfilePhone', trimmedPhone)
    localStorage.setItem('demoProfileEmail', trimmedEmail)
    localStorage.setItem('demoProfileMemberStart', memberStart)
    localStorage.setItem('demoProfileMemberEnd', memberEnd)
    const nextStatus =
      approvalStatus === 'approved' || approvalStatus === 'rejected'
        ? approvalStatus
        : 'pending'
    localStorage.setItem('demoProfileStatus', nextStatus)
    const members = loadMembers()
    const nextMembers = upsertMember(members, {
      id: userId,
      firstName: trimmedName,
      lastName: trimmedSurname,
      title: title.trim(),
      position: position.trim(),
      company: company.trim(),
      linkedinUrl: linkedinUrl.trim(),
      gender,
      phone: trimmedPhone,
      email: trimmedEmail,
      memberStart,
      memberEnd,
      status: nextStatus,
      role: members.find((item) => item.id === userId)?.role || role || 'guest',
      updatedAt: Date.now(),
    })
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(nextMembers))
    setApprovalStatus('pending')
    setSaveStatus('Profil güncellendi.')
    window.dispatchEvent(new Event('demoAuthChanged'))
  }

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
            <span className="profile-subtitle">{title || 'Ünvan'}</span>
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
          <div className="profile-row profile-row-input profile-field">
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
          <div className="profile-row profile-row-input profile-field">
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
          <div className="profile-row profile-row-input profile-field">
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
          <div className="profile-row profile-row-input profile-field">
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
          <div className="profile-row profile-row-input profile-field">
            <span>Topluluk Ünvanı</span>
            <div className="profile-input-wrap">
              <input
                className="contact-edit-input profile-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Topluluk Ünvanı"
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
          <div className="profile-row profile-row-input profile-field">
            <span>Cinsiyet</span>
            <div className="profile-input-wrap">
              <select
                className="contact-edit-input contact-edit-select profile-input"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
              >
                <option value="">Seçiniz</option>
                <option value="female">Kadın</option>
                <option value="male">Erkek</option>
              </select>
            </div>
          </div>
          <div className="profile-row profile-row-input profile-field profile-row-two">
            <div className="profile-row-inline">
              <span>Başlangıç</span>
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
              <span>Sonlanma</span>
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
          {saveStatus && <p className="profile-status">{saveStatus}</p>}
        </div>
        <button type="button" className="profile-save profile-save-full" onClick={handleSaveProfile}>
          Profili Kaydet
        </button>
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
