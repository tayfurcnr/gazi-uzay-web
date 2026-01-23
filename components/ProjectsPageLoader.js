'use client'

import { useEffect, useState } from 'react'
import LottieLoader from './LottieLoader'

const LOADER_SRC = '/lottie/space%20boy%20developer.json'

export default function ProjectsPageLoader({ durationMs = 700 }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), durationMs)
    return () => clearTimeout(timer)
  }, [durationMs])

  if (!visible) return null

  return (
    <div className="projects-page-loader" aria-hidden="true">
      <LottieLoader
        src={LOADER_SRC}
        label="Projeler yükleniyor..."
        size={180}
        placement="none"
      />
    </div>
  )
}
