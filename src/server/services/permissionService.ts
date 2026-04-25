/**
 * permissionService — décide si un utilisateur a une permission.
 * Pure logic + un loader DB optionnel.
 */
import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';
import { PERMISSION_WILDCARD, type Permission } from '@/server/permissions';

export interface PermissionServiceDeps {
  prisma?: PrismaClient;
}

export function hasPermission(
  effective: readonly string[],
  required: Permission,
): boolean {
  if (effective.includes(PERMISSION_WILDCARD)) return true;
  return effective.includes(required);
}

export function hasAnyPermission(
  effective: readonly string[],
  required: readonly Permission[],
): boolean {
  if (effective.includes(PERMISSION_WILDCARD)) return true;
  return required.some((p) => effective.includes(p));
}

export function hasAllPermissions(
  effective: readonly string[],
  required: readonly Permission[],
): boolean {
  if (effective.includes(PERMISSION_WILDCARD)) return true;
  return required.every((p) => effective.includes(p));
}

export function parsePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

export async function loadUserPermissions(
  userId: string,
  deps: PermissionServiceDeps = {},
): Promise<string[]> {
  const db = deps.prisma ?? defaultPrisma;
  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  const all = new Set<string>();
  for (const ur of userRoles) {
    for (const p of parsePermissions(ur.role.permissions)) all.add(p);
  }
  return Array.from(all);
}

export function assertPermission(
  effective: readonly string[],
  required: Permission,
): void {
  if (!hasPermission(effective, required)) {
    const err = new Error(`Forbidden: missing permission "${required}"`);
    err.name = 'PermissionDeniedError';
    throw err;
  }
}
