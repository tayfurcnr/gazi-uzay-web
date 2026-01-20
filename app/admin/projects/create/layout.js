import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../../api/auth/[...nextauth]/route'

const canCreateProject = (role) => role === 'MANAGEMENT' || role === 'FOUNDER'

export default async function ProjectCreateLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canCreateProject(session.user.role)) {
    redirect('/admin')
  }

  return children
}
