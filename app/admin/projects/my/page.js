'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import LottieLoader from '../../../../components/LottieLoader'

const LOADER_SRC = '/lottie/space%20boy%20developer.json'

const roleLabel = (role) => {
  const value = (role || '').toLowerCase()
  if (value === 'founder') return 'Kurucu'
  if (value === 'management') return 'Yönetim'
  if (value === 'lead') return 'Ekip Lideri'
  if (value === 'academy') return 'Akademi'
  if (value === 'member') return 'Üye'
  if (value === 'guest') return 'Misafir'
  return 'Üye'
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('demoRole') || ''
    setUserRole(role)
  }, [])

  useEffect(() => {
    if (!userRole) return
    if (userRole === 'guest') {
      window.location.href = '/login'
    }
  }, [userRole])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/projects/my')
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

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR')
    if (!normalized) return projects
    return projects.filter((project) => {
      const name = (project.name || '').toLocaleLowerCase('tr-TR')
      const yearText = project.year ? String(project.year) : ''
      return name.includes(normalized) || yearText.includes(normalized)
    })
  }, [projects, query])

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
            <h1>Projelerim</h1>
            <p className="admin-subtitle">Dahil olduğunuz projeleri görüntüleyin.</p>
          </div>
          <div className="admin-panel-actions">
            <input
              className="admin-portal-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ara"
            />
            <div className="admin-portal-pill">Projeler</div>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-loading admin-loading-overlay">
            <LottieLoader src={LOADER_SRC} label="Projeler yükleniyor..." size={150} />
          </div>
        ) : filteredProjects.length === 0 ? (
          <p className="admin-empty-state">Henüz dahil olduğunuz proje yok.</p>
        ) : (
          <div className="my-projects-grid">
            {filteredProjects.map((project) => (
              <article className="my-project-card" key={project.id}>
                <div className="my-project-card-inner">
                  <div className="my-project-media my-project-media-minimal">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} alt={project.name || 'Proje görseli'} />
                    ) : (
                      <div className="my-project-media-empty">Görsel yok</div>
                    )}
                  </div>
                  <div className="my-project-body">
                    <div className="my-project-header">
                      <div>
                        <h2>{project.name}</h2>
                        <span className="my-project-year">{project.year || 'Bilinmiyor'}</span>
                      </div>
                      <span className="my-project-role">{roleLabel(project.myRole)}</span>
                    </div>
                  {project.achievement ? (
                    <div className="my-project-achievement">{project.achievement}</div>
                  ) : null}
                  <p>{project.description}</p>
                  {project.driveUrl ? (
                    <a
                      className="my-project-drive-btn"
                      href={project.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Drive
                    </a>
                  ) : null}
                  <div className="my-project-team">
                    <span className="my-project-label">Ekip</span>
                      <div className="my-project-team-list">
                        {Array.isArray(project.members) && project.members.length ? (
                          project.members.map((member) => {
                            const name = `${member.firstName || ''} ${member.lastName || ''}`.trim()
                            const avatar = member.avatar || '/avatar-placeholder.svg'
                            const email = member.email || ''
                            const phone = member.phone || ''
                            return (
                              <div className="my-project-team-card" key={member.id}>
                                <div className="my-project-team-avatar">
                                  <img src={avatar} alt={name || member.email || 'Üye'} />
                                </div>
                                <div className="my-project-team-info">
                                  <span className="my-project-team-name">
                                    {name || member.email || 'Üye'}
                                  </span>
                                  <span className="my-project-team-role">
                                    {member.projectRole || 'Üye'}
                                  </span>
                                  <span className="my-project-team-meta">
                                    {email || 'E-posta yok'}
                                  </span>
                                  <span className="my-project-team-meta">
                                    {phone || 'Telefon yok'}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <span className="my-project-team-empty">Ekip bilgisi yok.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
