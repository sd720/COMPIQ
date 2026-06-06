import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  // No PrismaAdapter — using JWT sessions only (simpler, no DB session table needed)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'placeholder',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email as string;
        const name = (credentials.name as string) || 'Anonymous User';
        try {
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.create({ data: { email, name } });
          }
          return { id: user.id, email: user.email, name: user.name ?? name, image: user.image };
        } catch {
          // If DB fails, still allow sign-in with a temp session
          return { id: email, email, name };
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as typeof session.user & { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET ?? 'fallback-secret-for-build',
};

export default NextAuth(authOptions);
