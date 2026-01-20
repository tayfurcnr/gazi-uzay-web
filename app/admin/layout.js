import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../api/auth/[...nextauth]/route'

const isAdmin = (role) => role === 'MANAGEMENT' || role === 'FOUNDER' || role === 'LEAD'

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect('/login')
  }

  return children
}
