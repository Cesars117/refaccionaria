import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import db from "@/lib/db"
import { ROLES, normalizeRole } from "@/lib/rbac"

async function ensureBootstrapAdmin(username: string, password: string) {
  const userCount = await db.user.count()
  if (userCount > 0) return

  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "radiamex2026!"
  if (username !== "admin" || password !== bootstrapPassword) return

  const hashedPassword = await bcrypt.hash(password, 12)

  await db.user.create({
    data: {
      username: "admin",
      name: "Administrador",
      email: "admin@radiamex.local",
      password: hashedPassword,
      role: ROLES.ADMIN,
      isActive: true,
    },
  })
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim()
        const password = credentials?.password

        if (!username || !password) return null

        await ensureBootstrapAdmin(username, password)

        const user = await db.user.findFirst({
          where: {
            OR: [
              { username },
              { email: username },
            ],
          },
        })

        if (!user || !user.isActive) return null

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
          username: user.username,
        }
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = normalizeRole(token.role as string | undefined)
        session.user.username = (token.username as string | undefined) ?? null
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = normalizeRole(user.role)
        token.username = user.username ?? null
      }
      return token
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "wip-inventory-secret-key-2026"
}

export default NextAuth(authOptions)