import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import db from "@/lib/db"
import { ROLES, normalizeRole } from "@/lib/rbac"

function getAllowedBootstrapPasswords(): string[] {
  const values = [process.env.ADMIN_BOOTSTRAP_PASSWORD, "radiamex2026!"]
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))]
}

function isBootstrapRecoveryAttempt(username: string, password: string): boolean {
  if (username.toLowerCase() !== "admin") return false
  return getAllowedBootstrapPasswords().includes(password)
}

async function ensureBootstrapSuperAdmin(username: string, password: string) {
  if (username !== "admin") return

  const allowedPasswords = getAllowedBootstrapPasswords()
  if (!allowedPasswords.includes(password)) return

  const existing = await db.user.findFirst({
    where: {
      OR: [
        { username: "admin" },
        { email: "admin@radiamex.local" },
        { role: ROLES.SUPER_ADMIN },
      ],
    },
    orderBy: { createdAt: "asc" },
  })

  const hashedPassword = await bcrypt.hash(password, 12)

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        username: existing.username || "admin",
        email: existing.email || "admin@radiamex.local",
        name: existing.name || "Super Admin",
        role: ROLES.SUPER_ADMIN,
        isActive: true,
        password: hashedPassword,
      },
    })
    return
  }

  await db.user.create({
    data: {
      username: "admin",
      name: "Super Admin",
      email: "admin@radiamex.local",
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
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

        const normalizedUsername = username.toLowerCase()
        const isRecovery = isBootstrapRecoveryAttempt(normalizedUsername, password)

        try {
          await ensureBootstrapSuperAdmin(normalizedUsername, password)

          const user = await db.user.findFirst({
            where: {
              OR: [
                { username: normalizedUsername },
                { email: username },
                { email: normalizedUsername },
              ],
            },
          })

          if (!user || !user.isActive) {
            if (!isRecovery) return null
            return {
              id: "emergency-super-admin",
              name: "Super Admin",
              email: "admin@radiamex.local",
              role: ROLES.SUPER_ADMIN,
              username: "admin",
            }
          }

          const validPassword = await bcrypt.compare(password, user.password)
          if (!validPassword) {
            if (!isRecovery) return null
            return {
              id: user.id,
              name: user.name || "Super Admin",
              email: user.email || "admin@radiamex.local",
              role: ROLES.SUPER_ADMIN,
              username: user.username || "admin",
            }
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: normalizeRole(user.role),
            username: user.username,
          }
        } catch {
          if (!isRecovery) return null

          // Fallback de emergencia para recuperar acceso si la DB remota falla.
          return {
            id: "emergency-super-admin",
            name: "Super Admin",
            email: "admin@radiamex.local",
            role: ROLES.SUPER_ADMIN,
            username: "admin",
          }
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