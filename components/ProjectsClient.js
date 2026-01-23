'use client'

import { useMemo, useState } from 'react'
import ProjectsTeamDetails from './ProjectsTeamDetails'

const getMemberName = (user) => {
  const profile = user?.profile
  const firstName = profile?.firstName || ''
  const lastName = profile?.lastName || ''
  const fallback = user?.name || user?.email || 'Bilinmiyor'
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || fallback
}

export default function ProjectsClient({ projects }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

  const filteredProjects = useMemo(() => {
    if (!normalizedQuery) return projects
    return projects.filter((project) => {
      const name = (project.name || '').toLocaleLowerCase('tr-TR')
      const yearText = project.year ? String(project.year) : ''
      return name.includes(normalizedQuery) || yearText.includes(normalizedQuery)
    })
  }, [projects, normalizedQuery])

  const projectsByYear = filteredProjects.reduce((acc, project) => {
    const yearKey = String(project.year || 'Bilinmiyor')
    if (!acc[yearKey]) acc[yearKey] = []
    acc[yearKey].push(project)
    return acc
  }, {})

  const sortedYears = Object.keys(projectsByYear).sort((a, b) => Number(b) - Number(a))
  const hasProjects = projects.length > 0
  const hasResults = filteredProjects.length > 0

  return (
    <>
      <div className="projects-filters">
        <input
          className="projects-search"
          type="text"
          placeholder="Ara"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {!hasProjects ? (
        <p className="projects-empty">Henüz yayınlanan proje yok.</p>
      ) : !hasResults ? (
        <p className="projects-empty">Arama sonucuna uygun proje bulunamadı.</p>
      ) : (
        <div className="projects-years">
          {sortedYears.map((year) => (
            <details className="projects-year" key={year} open={year === sortedYears[0]}>
              <summary className="projects-year-toggle">
                <span className="projects-year-label">{year}</span>
              </summary>
              <div className="projects-year-count-inline">
                {projectsByYear[year].length} Proje
              </div>
              <div className="projects-grid">
                {projectsByYear[year].map((project) => (
                  <article className="projects-card" key={project.id}>
                    <div className="projects-card-media">
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt={project.name || 'Proje görseli'} />
                      ) : (
                        <div className="projects-card-media-empty">Görsel yok</div>
                      )}
                    </div>
                    <div className="projects-card-body">
                      <h2 className="projects-card-title">{project.name}</h2>
                      {project.achievement ? (
                        <div className="projects-achievement">{project.achievement}</div>
                      ) : null}
                      <div className="projects-card-separator">Proje Detayları</div>
                      <p className="projects-card-desc">{project.description}</p>
                      <ProjectsTeamDetails summary="Ekibi gör">
                        <div className="projects-team-list">
                          {(project.members || []).length ? (
                            project.members.map((member) => {
                              const name = getMemberName(member.user)
                              const linkedinUrl = member.user?.profile?.linkedinUrl || ''
                              const avatar =
                                member.user?.profile?.avatarUrl ||
                                member.user?.image ||
                                '/avatar-placeholder.svg'
                              return (
                                <div className="projects-team-card" key={member.id}>
                                  <div className="projects-team-avatar">
                                    <img
                                      src={avatar}
                                      alt={name ? `${name} avatar` : 'Üye avatarı'}
                                    />
                                  </div>
                                  <div className="projects-team-name">{name}</div>
                                  {member.role && (
                                    <div className="projects-team-role">{member.role}</div>
                                  )}
                                  {linkedinUrl ? (
                                    <a
                                      className="projects-team-link"
                                      href={linkedinUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      LinkedIn
                                    </a>
                                  ) : (
                                    <span className="projects-team-link projects-team-link-muted">
                                      LinkedIn yok
                                    </span>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <span className="projects-team-empty">Ekip bilgisi yok.</span>
                          )}
                        </div>
                      </ProjectsTeamDetails>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  )
}
