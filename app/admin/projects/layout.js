import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../api/auth/[...nextauth]/route'

const canManage = (role) =>
  role === 'MANAGEMENT' || role === 'FOUNDER' || role === 'LEAD'

export default async function ProjectsLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManage(session.user.role)) {
    redirect('/admin')
  }

  return children
}
