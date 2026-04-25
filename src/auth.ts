/**
 * Configuration NextAuth v4 (stable, production-ready).
 * Adapter Prisma + sessions JWT + augmentations de types pour exposer
 * userId et roles dans la session.
 */
import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    roles?: string[];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  // Aucun provider en MVP — à enrichir plus tard.
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof user.id === 'string') {
        const userId = user.id;
        token.userId = userId;
        const userRoles = await prisma.userRole.findMany({
          where: { userId },
          include: { role: true },
        });
        token.roles = userRoles.map(
          (ur: { role: { slug: string } }) => ur.role.slug,
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === 'string') {
        session.user.id = token.userId;
        session.user.roles = token.roles ?? [];
      }
      return session;
    },
  },
};
