'use client'

import { useEffect, useState } from 'react'

const DEFAULT_DATA = {
  banner: {
    title: 'Bizimle sponsor olarak yer almak ister misiniz?',
    text: 'Kurumsal iş birliği ve destek paketlerimiz için bize ulaşın.',
  },
  sponsorIntro: {
    title: 'Sponsorlarımız',
    text: 'Gazi Uzay projelerine destek veren kurum ve markalara teşekkür ederiz.',
  },
  packages: [
    {
      id: 'platinum',
      title: 'PLATİN PAKET',
      ctaSubject: 'Sponsor Paketi - Platin',
      ctaEmail: 'gaziuzay@gmail.com',
      perks: [
        'En üst düzey görünürlük ve marka konumlandırma',
        'Etkinliklerde konuşma ve özel tanıtım alanı',
        'Ortak PR, demo ve uzun vadeli iş birliği fırsatları',
      ],
    },
    {
      id: 'gold',
      title: 'ALTIN PAKET',
      ctaSubject: 'Sponsor Paketi - Altın',
      ctaEmail: 'gaziuzay@gmail.com',
      perks: [
        'Öncelikli logo yerleşimi ve sunum görünürlüğü',
        'Sosyal medya etiketleme ve düzenli görünürlük',
        'Etkinliklerde stand / afiş ve sponsorluk alanı',
      ],
    },
    {
      id: 'silver',
      title: 'GÜMÜŞ PAKET',
      ctaSubject: 'Sponsor Paketi - Gümüş',
      ctaEmail: 'gaziuzay@gmail.com',
      perks: [
        'Web sitesinde logo ve sponsor listesinde yer alma',
        'Sosyal medyada teşekkür paylaşımı',
        'Sunumlarda sponsor slaytı',
      ],
    },
  ],
  tiers: [
    {
      id: 'platinum',
      title: 'Stratejik Ortaklarımız',
      sizeClass: 'sponsor-logo-card-xl',
      sponsors: [
        { name: 'Kurumsal A', href: '#', logoUrl: '' },
        { name: 'Kurumsal B', href: '#', logoUrl: '' },
        { name: 'Kurumsal C', href: '#', logoUrl: '' },
      ],
    },
    {
      id: 'gold',
      title: 'Ana Destekçilerimiz',
      sizeClass: 'sponsor-logo-card-lg',
      sponsors: [
        { name: 'Kurumsal D', href: '#', logoUrl: '' },
        { name: 'Kurumsal E', href: '#', logoUrl: '' },
        { name: 'Kurumsal F', href: '#', logoUrl: '' },
        { name: 'Kurumsal G', href: '#', logoUrl: '' },
      ],
    },
    {
      id: 'silver',
      title: 'Destekçilerimiz',
      sizeClass: 'sponsor-logo-card-md',
      sponsors: [
        { name: 'Kurumsal H', href: '#', logoUrl: '' },
        { name: 'Kurumsal I', href: '#', logoUrl: '' },
        { name: 'Kurumsal J', href: '#', logoUrl: '' },
        { name: 'Kurumsal K', href: '#', logoUrl: '' },
        { name: 'Kurumsal L', href: '#', logoUrl: '' },
      ],
    },
  ],
}

const STORAGE_KEY = 'sponsorsData'

function buildLoopItems(items, minCount = 10) {
  const loopItems = []
  while (loopItems.length < minCount) {
    loopItems.push(...items)
  }
  return loopItems
}

function normalizeSponsorsData(stored) {
  if (!stored) return DEFAULT_DATA
  const base = DEFAULT_DATA
  const next = {
    ...base,
    ...stored,
    banner: { ...base.banner, ...(stored.banner || {}) },
    sponsorIntro: { ...base.sponsorIntro, ...(stored.sponsorIntro || {}) },
    packages: (stored.packages || base.packages).map((pkg, index) => ({
      ...base.packages[index],
      ...pkg,
    })),
    tiers: (stored.tiers || base.tiers).map((tier, index) => ({
      ...base.tiers[index],
      ...tier,
    })),
  }

  const legacyTitles = ['PLATİN SPONSOR', 'ALTIN SPONSOR', 'GÜMÜŞ SPONSOR']
  next.tiers = next.tiers.map((tier, index) => {
    if (!tier.title || legacyTitles.includes(tier.title)) {
      return { ...tier, title: base.tiers[index]?.title || tier.title }
    }
    return tier
  })
  return next
}

const normalizeRole = (value) => {
  if (value === 'admin') return 'management'
  if (value === 'publisher') return 'lead'
  if (value === 'editor') return 'member'
  return value || ''
}

export default function Sponsors() {
  const [data, setData] = useState(DEFAULT_DATA)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setData(normalizeSponsorsData(JSON.parse(stored)))
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
        setData(normalizeSponsorsData(JSON.parse(stored)))
      } catch {
        setData(DEFAULT_DATA)
      }
    } else {
      setData(DEFAULT_DATA)
    }
    setIsEditing(false)
  }

  const updateBanner = (field, value) => {
    setData((prev) => ({
      ...prev,
      banner: { ...prev.banner, [field]: value },
    }))
  }

  const updateSponsorIntro = (field, value) => {
    setData((prev) => ({
      ...prev,
      sponsorIntro: { ...prev.sponsorIntro, [field]: value },
    }))
  }

  const updatePackage = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg) =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      ),
    }))
  }

  const updatePackagePerk = (id, index, value) => {
    setData((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg) => {
        if (pkg.id !== id) return pkg
        const nextPerks = pkg.perks.map((perk, i) => (i === index ? value : perk))
        return { ...pkg, perks: nextPerks }
      }),
    }))
  }

  const addPackagePerk = (id) => {
    setData((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg) =>
        pkg.id === id ? { ...pkg, perks: [...pkg.perks, 'Yeni madde'] } : pkg
      ),
    }))
  }

  const removePackagePerk = (id, index) => {
    setData((prev) => ({
      ...prev,
      packages: prev.packages.map((pkg) => {
        if (pkg.id !== id) return pkg
        return { ...pkg, perks: pkg.perks.filter((_, i) => i !== index) }
      }),
    }))
  }

  const updateTier = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: value } : tier
      ),
    }))
  }

  const updateSponsor = (tierId, index, field, value) => {
    setData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => {
        if (tier.id !== tierId) return tier
        const nextSponsors = tier.sponsors.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
        return { ...tier, sponsors: nextSponsors }
      }),
    }))
  }

  const addSponsor = (tierId) => {
    setData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              sponsors: [
                ...tier.sponsors,
                { name: 'Yeni Sponsor', href: '#', logoUrl: '' },
              ],
            }
          : tier
      ),
    }))
  }

  const removeSponsor = (tierId, index) => {
    setData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => {
        if (tier.id !== tierId) return tier
        return {
          ...tier,
          sponsors: tier.sponsors.filter((_, i) => i !== index),
        }
      }),
    }))
  }

  const handleLogoUpload = (tierId, index, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateSponsor(tierId, index, 'logoUrl', String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const renderMarquee = (items, sizeClass, speedClass) => {
    const loopItems = buildLoopItems(items, 10)
    return (
      <div className="sponsor-marquee">
        <div className={`sponsor-track ${speedClass}`}>
          <div className="sponsor-track-inner">
            {loopItems.map((item, index) => (
              <a
                className={`sponsor-logo-card ${sizeClass}`}
                href={item.href}
                key={`${item.name}-${index}`}
              >
                <div className="sponsor-logo-mark">
                  {item.logoUrl ? (
                    <img src={item.logoUrl} alt={item.name} />
                  ) : (
                    <span>LOGO</span>
                  )}
                </div>
                <div className="sponsor-logo-name">{item.name}</div>
              </a>
            ))}
          </div>
          <div className="sponsor-track-inner" aria-hidden="true">
            {loopItems.map((item, index) => (
              <a
                className={`sponsor-logo-card ${sizeClass}`}
                href={item.href}
                key={`${item.name}-dup-${index}`}
              >
                <div className="sponsor-logo-mark">
                  {item.logoUrl ? (
                    <img src={item.logoUrl} alt={item.name} />
                  ) : (
                    <span>LOGO</span>
                  )}
                </div>
                <div className="sponsor-logo-name">{item.name}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    )
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

      <div className="sponsors-banner sponsors-banner-secondary">
        <div className="sponsors-banner-content">
          {isEditing ? (
            <input
              className="contact-edit-input contact-edit-input-center"
              value={data.sponsorIntro.title}
              onChange={(event) => updateSponsorIntro('title', event.target.value)}
            />
          ) : (
            <p className="page-subtitle page-subtitle-strong">{data.sponsorIntro.title}</p>
          )}
          {isEditing ? (
            <textarea
              className="contact-edit-input contact-edit-textarea"
              value={data.sponsorIntro.text}
              onChange={(event) => updateSponsorIntro('text', event.target.value)}
            />
          ) : (
            <p className="sponsors-banner-text">{data.sponsorIntro.text}</p>
          )}
        </div>
      </div>

      {data.tiers.map((tier, tierIndex) => (
        <div className="sponsors-section" key={tier.id}>
          <div className="sponsors-tier-header">
            {isEditing ? (
              <div className="contact-edit-row contact-edit-row-wide">
                <input
                  className="contact-edit-input contact-edit-input-center"
                  value={tier.title}
                  onChange={(event) => updateTier(tier.id, 'title', event.target.value)}
                />
              </div>
            ) : (
              <h2 className="sponsors-title">{tier.title}</h2>
            )}
          </div>
          <div className="nav-separator"></div>
          {renderMarquee(
            tier.sponsors,
            tier.sizeClass,
            tierIndex === 0 ? 'sponsor-track-slow' : tierIndex === 1 ? 'sponsor-track-med' : 'sponsor-track-fast'
          )}

          {isEditing && (
            <div className="sponsor-edit-panel">
              {tier.sponsors.map((item, index) => (
                <div className="sponsor-edit-row" key={`${tier.id}-${index}`}>
                  <input
                    className="contact-edit-input"
                    value={item.name}
                    onChange={(event) => updateSponsor(tier.id, index, 'name', event.target.value)}
                    placeholder="Firma adı"
                  />
                  <input
                    className="contact-edit-input"
                    value={item.href}
                    onChange={(event) => updateSponsor(tier.id, index, 'href', event.target.value)}
                    placeholder="Firma web sitesi"
                  />
                  <input
                    className="contact-edit-input"
                    value={item.logoUrl}
                    onChange={(event) => updateSponsor(tier.id, index, 'logoUrl', event.target.value)}
                    placeholder="Logo URL (opsiyonel)"
                  />
                  <input
                    className="sponsor-edit-file"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleLogoUpload(tier.id, index, event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="sponsor-edit-remove"
                    onClick={() => removeSponsor(tier.id, index)}
                  >
                    Sil
                  </button>
                </div>
              ))}
              <button type="button" className="sponsor-edit-add" onClick={() => addSponsor(tier.id)}>
                + Sponsor ekle
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="sponsors-banner">
        <div className="sponsors-banner-content">
          {isEditing ? (
            <input
              className="contact-edit-input contact-edit-input-center"
              value={data.banner.title}
              onChange={(event) => updateBanner('title', event.target.value)}
            />
          ) : (
            <p className="page-subtitle page-subtitle-strong">{data.banner.title}</p>
          )}
          {isEditing ? (
            <textarea
              className="contact-edit-input contact-edit-textarea"
              value={data.banner.text}
              onChange={(event) => updateBanner('text', event.target.value)}
            />
          ) : (
            <p className="sponsors-banner-text">{data.banner.text}</p>
          )}
        </div>
      </div>

      <div className="sponsors-packages">
        {data.packages.map((pkg) => (
          <div className={`sponsors-package-card sponsors-package-${pkg.id}`} key={pkg.id}>
            <div className="sponsors-package-header">
              {isEditing ? (
                <input
                  className="contact-edit-input contact-edit-input-center"
                  value={pkg.title}
                  onChange={(event) => updatePackage(pkg.id, 'title', event.target.value)}
                />
              ) : (
                <h3>{pkg.title}</h3>
              )}
            </div>
            {isEditing ? (
              <div className="package-edit-list">
                {pkg.perks.map((perk, index) => (
                  <div className="package-edit-row" key={`${pkg.id}-perk-${index}`}>
                    <input
                      className="contact-edit-input"
                      value={perk}
                      onChange={(event) => updatePackagePerk(pkg.id, index, event.target.value)}
                    />
                    <button
                      type="button"
                      className="package-edit-remove"
                      onClick={() => removePackagePerk(pkg.id, index)}
                    >
                      Sil
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="package-edit-add"
                  onClick={() => addPackagePerk(pkg.id)}
                >
                  + Madde ekle
                </button>
              </div>
            ) : (
              <ul>
                {pkg.perks.map((perk, index) => (
                  <li key={`${pkg.id}-perk-${index}`}>{perk}</li>
                ))}
              </ul>
            )}
            <div className="sponsors-package-footer">
              {isEditing ? (
                <div className="contact-edit-row">
                  <div className="contact-edit-block">
                    <label className="contact-edit-label">E-posta Adresi</label>
                    <input
                      className="contact-edit-input contact-edit-input-center"
                      value={pkg.ctaEmail || 'gaziuzay@gmail.com'}
                      onChange={(event) => updatePackage(pkg.id, 'ctaEmail', event.target.value)}
                    />
                  </div>
                  <div className="contact-edit-block">
                    <label className="contact-edit-label">E-posta Konusu</label>
                    <input
                      className="contact-edit-input contact-edit-input-center"
                      value={pkg.ctaSubject}
                      onChange={(event) => updatePackage(pkg.id, 'ctaSubject', event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <a
                  className="sponsors-package-cta"
                  href={`mailto:${pkg.ctaEmail || 'gaziuzay@gmail.com'}?subject=${encodeURIComponent(pkg.ctaSubject)}`}
                >
                  İletişime geç
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
