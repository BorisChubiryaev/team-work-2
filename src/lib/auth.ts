import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth - requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
        name: { label: 'Имя', type: 'text' },
        mode: { label: 'Режим', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        const mode = credentials.mode || 'login'

        if (mode === 'register') {
          const existing = await db.user.findUnique({ where: { email: credentials.email } })
          if (existing) {
            return {
              id: existing.id,
              email: existing.email,
              name: existing.name,
              role: existing.role,
              position: existing.position,
            }
          }
          const user = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.name || credentials.email.split('@')[0],
              role: 'employee',
            },
          })
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            position: user.position,
          }
        }

        // Login mode - find user by email
        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (!user) {
          // Auto-create user for demo
          const newUser = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.name || credentials.email.split('@')[0],
              role: 'employee',
            },
          })
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            position: newUser.position,
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          position: user.position,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      // Auto-upsert user from Google OAuth
      if (user.email) {
        const existing = await db.user.findUnique({ where: { email: user.email } })
        if (!existing) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              avatar: user.image || null,
              role: 'employee',
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch user from DB to get role
        const dbUser = await db.user.findUnique({ where: { email: user.email! } })
        token.id = dbUser?.id || user.id
        token.role = dbUser?.role || 'employee'
        token.position = dbUser?.position || null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string }).id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
        ;(session.user as { position?: string }).position = token.position as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
