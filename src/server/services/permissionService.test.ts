import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  parsePermissions,
  assertPermission,
} from './permissionService';
import { PERMISSIONS, PERMISSION_WILDCARD } from '@/server/permissions';

describe('permissionService — hasPermission', () => {
  it('returns true when the permission is in the list', () => {
    expect(hasPermission([PERMISSIONS.USER_READ], PERMISSIONS.USER_READ)).toBe(true);
  });

  it('returns false when the permission is missing', () => {
    expect(hasPermission([PERMISSIONS.USER_READ], PERMISSIONS.ROLE_MANAGE)).toBe(false);
  });

  it('honors the wildcard "*" as super-admin', () => {
    expect(hasPermission([PERMISSION_WILDCARD], PERMISSIONS.ROLE_MANAGE)).toBe(true);
  });
});

describe('permissionService — hasAnyPermission / hasAllPermissions', () => {
  it('hasAnyPermission returns true if at least one matches', () => {
    expect(
      hasAnyPermission(
        [PERMISSIONS.USER_READ],
        [PERMISSIONS.USER_READ, PERMISSIONS.ROLE_MANAGE],
      ),
    ).toBe(true);
  });

  it('hasAnyPermission returns false if none match', () => {
    expect(
      hasAnyPermission([PERMISSIONS.USER_READ], [PERMISSIONS.ROLE_MANAGE]),
    ).toBe(false);
  });

  it('hasAllPermissions requires every permission', () => {
    expect(
      hasAllPermissions(
        [PERMISSIONS.USER_READ, PERMISSIONS.ROLE_READ],
        [PERMISSIONS.USER_READ, PERMISSIONS.ROLE_READ],
      ),
    ).toBe(true);
    expect(
      hasAllPermissions(
        [PERMISSIONS.USER_READ],
        [PERMISSIONS.USER_READ, PERMISSIONS.ROLE_READ],
      ),
    ).toBe(false);
  });

  it('wildcard satisfies any/all checks', () => {
    expect(
      hasAnyPermission(
        [PERMISSION_WILDCARD],
        [PERMISSIONS.USER_READ, PERMISSIONS.ROLE_MANAGE],
      ),
    ).toBe(true);
    expect(
      hasAllPermissions(
        [PERMISSION_WILDCARD],
        [PERMISSIONS.USER_READ, PERMISSIONS.ROLE_MANAGE],
      ),
    ).toBe(true);
  });
});

describe('permissionService — parsePermissions', () => {
  it('returns [] for non-array input', () => {
    expect(parsePermissions(null)).toEqual([]);
    expect(parsePermissions(undefined)).toEqual([]);
    expect(parsePermissions({})).toEqual([]);
    expect(parsePermissions('user:read')).toEqual([]);
  });

  it('keeps only string values', () => {
    expect(parsePermissions(['user:read', 42, null, 'role:read'])).toEqual([
      'user:read',
      'role:read',
    ]);
  });
});

describe('permissionService — assertPermission', () => {
  it('throws PermissionDeniedError when missing', () => {
    expect(() =>
      assertPermission([PERMISSIONS.USER_READ], PERMISSIONS.ROLE_MANAGE),
    ).toThrowError(/Forbidden/);
  });

  it('does not throw when permission is granted', () => {
    expect(() =>
      assertPermission([PERMISSIONS.USER_READ], PERMISSIONS.USER_READ),
    ).not.toThrow();
  });
});
