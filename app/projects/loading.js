'use client'

import LottieLoader from '../../components/LottieLoader'

const LOADER_SRC = '/lottie/space%20boy%20developer.json'

export default function ProjectsLoading() {
  return (
    <div className="projects-page-loader" role="status" aria-live="polite">
      <LottieLoader src={LOADER_SRC} label="Projeler yükleniyor..." size={180} placement="none" />
    </div>
  )
}
