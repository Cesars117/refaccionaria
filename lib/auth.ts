import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Simple hardcoded auth for now - can be improved later
        if (credentials?.username === "admin" && credentials?.password === "wip2026!") {
          return {
            id: "1",
            name: "WIP Admin",
            email: "admin@wip.com"
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async session({ session }) {
      return session
    },
    async jwt({ token }) {
      return token
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "wip-inventory-secret-key-2026"
}

export default NextAuth(authOptions)