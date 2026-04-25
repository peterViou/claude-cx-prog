/**
 * auditService — crée et lit des AuditEvent.
 * `recordAuditEvent` est best-effort : il ne fait jamais échouer l'action métier.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';

export interface AuditServiceDeps {
  prisma?: PrismaClient;
}

export interface RecordAuditEventInput {
  action: string;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditEventRecord {
  id: string;
  action: string;
  actorUserId: string | null;
  targetType: string | null;
  targetId: string | null;
  createdAt: Date;
}

export async function recordAuditEvent(
  input: RecordAuditEventInput,
  deps: AuditServiceDeps = {},
): Promise<AuditEventRecord | null> {
  const db = deps.prisma ?? defaultPrisma;
  try {
    return await db.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata: input.metadata ?? {},
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
      select: {
        id: true,
        action: true,
        actorUserId: true,
        targetType: true,
        targetId: true,
        createdAt: true,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[auditService] failed to record event', { action: input.action, err });
    return null;
  }
}

export interface ListAuditEventsQuery {
  actorUserId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  limit?: number;
  cursor?: string;
}

export async function listAuditEvents(
  query: ListAuditEventsQuery,
  deps: AuditServiceDeps = {},
): Promise<AuditEventRecord[]> {
  const db = deps.prisma ?? defaultPrisma;
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  return db.auditEvent.findMany({
    where: {
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      actorUserId: true,
      targetType: true,
      targetId: true,
      createdAt: true,
    },
  });
}
