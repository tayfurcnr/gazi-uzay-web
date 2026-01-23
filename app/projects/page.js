import { prisma } from '../../lib/prisma'
import ProjectsClient from '../../components/ProjectsClient'
import ProjectsPageLoader from '../../components/ProjectsPageLoader'

export const revalidate = 0

const getProjects = async () => {
  return prisma.project.findMany({
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: {
      members: { include: { user: { include: { profile: true } } } },
    },
  })
}

export default async function Projects() {
  const projects = await getProjects()
  const safeProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    year: project.year,
    imageUrl: project.imageUrl,
    achievement: project.achievement,
    members: (project.members || []).map((member) => ({
      id: member.id,
      role: member.role,
      user: {
        name: member.user?.name,
        email: member.user?.email,
        image: member.user?.image,
        profile: member.user?.profile
          ? {
              firstName: member.user.profile.firstName,
              lastName: member.user.profile.lastName,
              linkedinUrl: member.user.profile.linkedinUrl,
              avatarUrl: member.user.profile.avatarUrl,
            }
          : null,
      },
    })),
  }))
  return (
    <div>
      <ProjectsPageLoader />
      <div className="page-header">
        <h1 className="page-title">Projeler</h1>
        <p className="page-subtitle">
          Topluluğumuz çatısı altında yürütülen projeleri genel hatlarıyla inceleyin.
        </p>
      </div>
      <ProjectsClient projects={safeProjects} />
    </div>
  )
}
