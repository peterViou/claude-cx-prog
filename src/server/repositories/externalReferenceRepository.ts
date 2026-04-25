import type {
  ExternalProvider,
  ExternalReference,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';

export interface ExternalRefRepoDeps {
  prisma?: PrismaClient;
}

export interface UpsertExternalReferenceInput {
  internalType: string;
  internalId: string;
  provider: ExternalProvider;
  resource?: string | null;
  externalId: string;
  metadata?: Prisma.InputJsonValue;
  lastSyncRunId?: string | null;
}

export async function upsertExternalReference(
  input: UpsertExternalReferenceInput,
  deps: ExternalRefRepoDeps = {},
): Promise<ExternalReference> {
  const db = deps.prisma ?? defaultPrisma;
  return db.externalReference.upsert({
    where: {
      provider_resource_externalId: {
        provider: input.provider,
        resource: input.resource ?? '',
        externalId: input.externalId,
      },
    },
    update: {
      internalType: input.internalType,
      internalId: input.internalId,
      metadata: input.metadata ?? {},
      lastSyncedAt: new Date(),
      ...(input.lastSyncRunId ? { lastSyncRunId: input.lastSyncRunId } : {}),
    },
    create: {
      internalType: input.internalType,
      internalId: input.internalId,
      provider: input.provider,
      resource: input.resource ?? null,
      externalId: input.externalId,
      metadata: input.metadata ?? {},
      lastSyncedAt: new Date(),
      lastSyncRunId: input.lastSyncRunId ?? null,
    },
  });
}

export async function findExternalReferencesForInternal(
  internalType: string,
  internalId: string,
  deps: ExternalRefRepoDeps = {},
): Promise<ExternalReference[]> {
  return (deps.prisma ?? defaultPrisma).externalReference.findMany({
    where: { internalType, internalId },
  });
}
