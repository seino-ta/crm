import { AuditAction, type Prisma } from '@prisma/client';

import prisma from '../../lib/prisma';

function serialize(value?: Record<string, unknown>): Prisma.InputJsonValue | null {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function createAuditLogEntry(params: {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId?: string;
  opportunityId?: string | null;
  changes?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.actorId,
      opportunityId: params.opportunityId ?? null,
      changes: serialize(params.changes ?? undefined),
    },
  });
}
