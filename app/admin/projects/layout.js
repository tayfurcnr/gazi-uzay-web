import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../api/auth/[...nextauth]/route'

const canAccessProjects = (role) => role && role !== 'GUEST'

export default async function ProjectsLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canAccessProjects(session.user.role)) {
    redirect('/admin')
  }

  return children
}
