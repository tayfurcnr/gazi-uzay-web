import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../../../../lib/prisma'

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    session({ session, user }) {
      if (user?.role) {
        session.user.role = user.role
      }
      return session
    },
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('NextAuth error:', code, metadata)
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
