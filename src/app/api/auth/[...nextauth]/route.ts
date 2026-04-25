/**
 * Handler NextAuth v4 pour App Router.
 * NextAuth v4 fournit un handler générique réutilisable pour GET et POST.
 */
import NextAuth from 'next-auth';
import { authOptions } from '@/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
