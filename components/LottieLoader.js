'use client'

import { useEffect, useState } from 'react'

const LOTTIE_SCRIPT_SRC =
  'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'

export default function LottieLoader({
  src,
  label = 'Yükleniyor...',
  size = 160,
  placement = 'center',
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.customElements && window.customElements.get('lottie-player')) {
      setIsReady(true)
      return
    }

    const existing = document.querySelector(`script[src="${LOTTIE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => setIsReady(true), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = LOTTIE_SCRIPT_SRC
    script.async = true
    script.onload = () => setIsReady(true)
    document.body.appendChild(script)
  }, [])

  return (
    <div
      className={`lottie-loader${
        placement === 'top'
          ? ' lottie-loader-top'
          : placement === 'center'
          ? ' lottie-loader-center'
          : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {isReady ? (
        <lottie-player
          class="lottie-loader-player"
          src={src}
          background="transparent"
          speed="1"
          loop
          autoplay
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="lottie-loader-player"
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      )}
      <div className="lottie-loader-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  )
}
