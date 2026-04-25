import { describe, it, expect, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { recordAuditEvent, listAuditEvents } from './auditService';

function makePrismaMock(): {
  prisma: PrismaClient;
  createSpy: ReturnType<typeof vi.fn>;
  findManySpy: ReturnType<typeof vi.fn>;
} {
  const createSpy = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'evt_1',
    action: data.action,
    actorUserId: data.actorUserId ?? null,
    targetType: data.targetType ?? null,
    targetId: data.targetId ?? null,
    createdAt: new Date('2026-04-25T12:00:00Z'),
  }));
  const findManySpy = vi.fn(async () => [
    {
      id: 'evt_1',
      action: 'user.login',
      actorUserId: 'u_1',
      targetType: null,
      targetId: null,
      createdAt: new Date('2026-04-25T12:00:00Z'),
    },
  ]);

  const prisma = {
    auditEvent: {
      create: createSpy,
      findMany: findManySpy,
    },
  } as unknown as PrismaClient;

  return { prisma, createSpy, findManySpy };
}

describe('auditService — recordAuditEvent', () => {
  it('creates an event with required fields', async () => {
    const { prisma, createSpy } = makePrismaMock();
    const ev = await recordAuditEvent(
      { action: 'user.login', actorUserId: 'u_1', metadata: { method: 'oauth' } },
      { prisma },
    );
    expect(ev).not.toBeNull();
    expect(ev?.action).toBe('user.login');
    expect(createSpy).toHaveBeenCalledOnce();
    const call = createSpy.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(call.data.action).toBe('user.login');
    expect(call.data.actorUserId).toBe('u_1');
    expect(call.data.metadata).toEqual({ method: 'oauth' });
  });

  it('returns null and does not throw if DB fails (best-effort)', async () => {
    const failingPrisma = {
      auditEvent: { create: vi.fn().mockRejectedValue(new Error('boom')) },
    } as unknown as PrismaClient;

    const ev = await recordAuditEvent({ action: 'system.tick' }, { prisma: failingPrisma });
    expect(ev).toBeNull();
  });

  it('uses defaults for optional fields', async () => {
    const { prisma, createSpy } = makePrismaMock();
    await recordAuditEvent({ action: 'system.tick' }, { prisma });
    const call = createSpy.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(call.data.metadata).toEqual({});
    expect(call.data.actorUserId).toBeNull();
    expect(call.data.targetType).toBeNull();
    expect(call.data.targetId).toBeNull();
  });
});

describe('auditService — listAuditEvents', () => {
  it('clamps limit between 1 and 200', async () => {
    const { prisma, findManySpy } = makePrismaMock();
    await listAuditEvents({ limit: 5000 }, { prisma });
    const args = findManySpy.mock.calls[0]?.[0] as { take: number };
    expect(args.take).toBe(200);

    await listAuditEvents({ limit: -1 }, { prisma });
    const args2 = findManySpy.mock.calls[1]?.[0] as { take: number };
    expect(args2.take).toBe(1);
  });

  it('passes filters to prisma', async () => {
    const { prisma, findManySpy } = makePrismaMock();
    await listAuditEvents(
      { action: 'user.login', actorUserId: 'u_1' },
      { prisma },
    );
    const args = findManySpy.mock.calls[0]?.[0] as { where: Record<string, unknown> };
    expect(args.where.action).toBe('user.login');
    expect(args.where.actorUserId).toBe('u_1');
  });
});
