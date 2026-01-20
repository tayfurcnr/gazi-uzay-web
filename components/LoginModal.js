'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginModal({ open, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const handleGoogleLogin = () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    signIn('google', { callbackUrl: window.location.href })
  }

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(event) => event.stopPropagation()}>
        <div className="login-card login-card-wide login-card-modal">
          <div className="login-banner">
            <div className="login-hero-logo">
              <img src="/logo.png" alt="Gazi Uzay Logo" />
            </div>
            <div>
              <h1>GAZI UZAY</h1>
              <p className="login-subtitle-strong">YETKİLİ GİRİŞİ</p>
            </div>
          </div>

          <div className="login-content">
            <div className="login-actions">
              <button type="button" className="login-google-btn" onClick={handleGoogleLogin} disabled={isSubmitting}>
                <span className="login-google-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M21.6 12.23c0-.74-.06-1.29-.2-1.86H12v3.51h5.5c-.11.9-.71 2.26-2.04 3.17l-.02.12 3.05 2.36.21.02c1.92-1.77 3.04-4.37 3.04-7.32z" />
                    <path d="M12 22c2.76 0 5.08-.91 6.78-2.46l-3.24-2.5c-.86.6-2.03 1.03-3.54 1.03-2.7 0-4.99-1.77-5.81-4.22l-.12.01-3.16 2.44-.04.12C4.3 19.77 7.83 22 12 22z" />
                    <path d="M6.19 13.85A6.7 6.7 0 0 1 5.84 12c0-.64.12-1.26.33-1.85l-.01-.13-3.2-2.49-.1.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.47l3.12-2.42z" />
                    <path d="M12 5.93c1.7 0 2.84.73 3.5 1.34l2.55-2.49C16.99 3.33 14.76 2 12 2 7.83 2 4.3 4.23 2.92 7.58l3.14 2.44C7 7.57 9.3 5.93 12 5.93z" />
                  </svg>
                </span>
                GOOGLE İLE GİRİŞ YAP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
