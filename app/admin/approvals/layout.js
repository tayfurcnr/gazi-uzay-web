import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../api/auth/[...nextauth]/route'

const canApprove = (role) => role === 'MANAGEMENT' || role === 'FOUNDER'

export default async function ApprovalsLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canApprove(session.user.role)) {
    redirect('/admin')
  }

  return children
}
