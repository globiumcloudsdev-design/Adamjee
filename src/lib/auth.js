import { getServerSession } from "next-auth/next";
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/database';
import { User } from '@/backend/models/postgres';
import bcrypt from 'bcryptjs';
import { authenticate } from "@/backend/middleware/auth";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // No need to call connectDB() if using Sequelize, but let's ensure it's initialized
          // actually config/database.js exports initialized sequelize instance
          
          const user = await User.scope("withPassword").findOne({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("No user found with email:", credentials.email);
            return null;
          }

          const isPasswordValid = await user.comparePassword(credentials.password);
          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
            name: `${user.first_name} ${user.last_name}`,
            branch_id: user.branch_id,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.branch_id = user.branch_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.branch_id = token.branch_id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export async function getCurrentUser(req) {
  // 1. Try project's custom JWT authentication first (from Authorization header)
  if (req) {
    const auth = await authenticate(req);
    if (!auth.error && auth.user) {
      return auth.user;
    }
  }

  // 2. Fallback to NextAuth session (if any)
  const session = await getServerSession(authOptions);
  return session?.user;
}
