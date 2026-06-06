import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '@/lib/db';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
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
          const sql = getDb();
          let users = await sql`SELECT id, email, name, image FROM users WHERE email = ${email} LIMIT 1`;
          if (!users.length) {
            users = await sql`INSERT INTO users (id, name, email, "createdAt", "updatedAt")
              VALUES (gen_random_uuid(), ${name}, ${email}, NOW(), NOW()) RETURNING id, email, name, image`;
          }
          const user = users[0];
          return { id: user.id, email: user.email, name: user.name ?? name, image: user.image ?? null };
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
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET ?? 'fallback-secret-for-build',
};

export default NextAuth(authOptions);
