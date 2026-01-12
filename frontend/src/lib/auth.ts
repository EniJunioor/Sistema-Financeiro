import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { apiClient } from "./api"

// Note: In a real implementation, you would import your Prisma client here
// For now, we'll use a mock configuration without the PrismaAdapter

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Will be configured when Prisma is set up
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Call backend API for authentication
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            }
          }
        } catch (error) {
          console.error('Authentication error:', error)
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    // signUp is not a valid NextAuth page option
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      return session
    },
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}