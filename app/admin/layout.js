import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../api/auth/[...nextauth]/route'

const canAccessAdmin = (role) => role && role !== 'GUEST'

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    redirect('/login')
  }

  return children
}
