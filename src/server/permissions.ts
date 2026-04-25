/**
 * Catalogue centralisé des permissions.
 * Convention : "domaine:action".
 * "*" = wildcard super-admin.
 */

export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_MANAGE: 'user:manage',
  ROLE_READ: 'role:read',
  ROLE_MANAGE: 'role:manage',
  AUDIT_READ: 'audit:read',
  INTEGRATION_READ: 'integration:read',
  INTEGRATION_MANAGE: 'integration:manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[PermissionKey];

export const PERMISSION_WILDCARD = '*' as const;
