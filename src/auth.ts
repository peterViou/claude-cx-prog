/**
 * Configuration centrale Auth.js v5 (NextAuth).
 * - Adapter Prisma (sessions DB).
 * - Aucun provider en dur en MVP : la liste `providers` est vide
 *   et sera enrichie plus tard (Google, Email, Credentials...).
 * - Augmente la Session pour exposer userId / roles.
 */
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession['user'];
  }
}

interface CustomTokenFields {
  userId?: string;
  roles?: string[];
}

function readUserId(token: Record<string, unknown>): string | undefined {
  const v = token.userId;
  return typeof v === 'string' ? v : undefined;
}

function readRoles(token: Record<string, unknown>): string[] {
  const v = token.roles;
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof user.id === 'string') {
        const userId = user.id;
        const userRoles = await prisma.userRole.findMany({
          where: { userId },
          include: { role: true },
        });
        const slugs = userRoles.map(
          (ur: { role: { slug: string } }) => ur.role.slug,
        );
        const patch: CustomTokenFields = { userId, roles: slugs };
        return { ...token, ...patch };
      }
      return token;
    },
    async session({ session, token }) {
      const tokenRecord = token as Record<string, unknown>;
      const userId = readUserId(tokenRecord);
      if (userId !== undefined) {
        session.user.id = userId;
        session.user.roles = readRoles(tokenRecord);
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
