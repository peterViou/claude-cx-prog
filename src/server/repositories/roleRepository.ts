import type { PrismaClient, Role } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';

export interface RoleRepoDeps {
  prisma?: PrismaClient;
}

export async function findRoleBySlug(
  slug: string,
  deps: RoleRepoDeps = {},
): Promise<Role | null> {
  return (deps.prisma ?? defaultPrisma).role.findUnique({ where: { slug } });
}

export async function listRoles(deps: RoleRepoDeps = {}): Promise<Role[]> {
  return (deps.prisma ?? defaultPrisma).role.findMany({ orderBy: { slug: 'asc' } });
}
