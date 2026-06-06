import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()
        const password = credentials.password

        // Verificar si es el administrador hardcodeado en .env
        if (
          email === process.env.ADMIN_EMAIL?.toLowerCase() &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: 'admin',
            email: process.env.ADMIN_EMAIL!,
            name: 'Administrador',
            role: 'admin',
          }
        }

        // Verificar cliente en la base de datos
        const cliente = await prisma.cliente.findUnique({ where: { email } })
        if (!cliente) return null

        const passwordValida = await bcrypt.compare(password, cliente.contrasena)
        if (!passwordValida) return null

        return {
          id: String(cliente.id),
          email: cliente.email,
          name: cliente.nombre,
          role: 'cliente',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
  },
}
