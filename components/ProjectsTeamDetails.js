'use client'

import { useCallback, useRef } from 'react'

export default function ProjectsTeamDetails({ summary, children }) {
  const detailsRef = useRef(null)

  const handleToggle = useCallback((event) => {
    const current = event.currentTarget
    if (!current.open) return
    const container = current.closest('.projects-grid') || current.parentElement
    if (!container) return
    container.querySelectorAll('details.projects-team[open]').forEach((node) => {
      if (node !== current) node.open = false
    })
  }, [])

  return (
    <details ref={detailsRef} className="projects-team" onToggle={handleToggle}>
      <summary className="projects-team-toggle">{summary}</summary>
      {children}
    </details>
  )
}
