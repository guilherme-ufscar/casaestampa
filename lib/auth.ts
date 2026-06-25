import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.ativo) return null

        const senhaValida = await bcrypt.compare(credentials.password, user.senha)
        if (!senhaValida) return null

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
          instaladorId: user.instaladorId ?? null,
          soAgenda: user.soAgenda,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { id: string; role: string; instaladorId?: string | null; soAgenda?: boolean }).role
        token.instaladorId = (user as { instaladorId?: string | null }).instaladorId ?? null
        token.soAgenda = (user as { soAgenda?: boolean }).soAgenda ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.instaladorId = token.instaladorId as string | null | undefined
        session.user.soAgenda = token.soAgenda as boolean | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
