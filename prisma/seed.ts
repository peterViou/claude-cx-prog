/**
 * Seed initial — rôles de base. Idempotent.
 *   pnpm db:seed
 */
import { PrismaClient } from '@prisma/client';
import { PERMISSION_WILDCARD, PERMISSIONS } from '../src/server/permissions';

const prisma = new PrismaClient();

interface RoleSeed {
  slug: string;
  name: string;
  description: string;
  permissions: string[];
}

const ROLES: RoleSeed[] = [
  {
    slug: 'admin',
    name: 'Administrateur',
    description: 'Accès total — wildcard.',
    permissions: [PERMISSION_WILDCARD],
  },
  {
    slug: 'manager',
    name: 'Manager',
    description: 'Gestion users / rôles / intégrations.',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.ROLE_READ,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.INTEGRATION_READ,
      PERMISSIONS.INTEGRATION_MANAGE,
    ],
  },
  {
    slug: 'operator',
    name: 'Opérateur',
    description: 'Lecture étendue.',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.ROLE_READ,
      PERMISSIONS.INTEGRATION_READ,
    ],
  },
  {
    slug: 'viewer',
    name: 'Lecteur',
    description: 'Lecture seule.',
    permissions: [PERMISSIONS.USER_READ],
  },
];

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[seed] Upsert des rôles...');
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      update: {
        name: r.name,
        description: r.description,
        permissions: r.permissions,
      },
      create: {
        slug: r.slug,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`  - ${r.slug} ✓`);
  }
  // eslint-disable-next-line no-console
  console.log('[seed] OK');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
