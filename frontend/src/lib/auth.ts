import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

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

        // TODO: Implement actual authentication logic with backend API
        // This is a mock implementation
        if (credentials.email === "admin@example.com" && credentials.password === "password") {
          return {
            id: "1",
            email: credentials.email,
            name: "Admin User",
          }
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