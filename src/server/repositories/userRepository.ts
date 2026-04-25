import type { PrismaClient, User } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';

export interface UserRepoDeps {
  prisma?: PrismaClient;
}

export async function findUserById(
  id: string,
  deps: UserRepoDeps = {},
): Promise<User | null> {
  return (deps.prisma ?? defaultPrisma).user.findUnique({ where: { id } });
}

export async function findUserByEmail(
  email: string,
  deps: UserRepoDeps = {},
): Promise<User | null> {
  return (deps.prisma ?? defaultPrisma).user.findUnique({ where: { email } });
}
