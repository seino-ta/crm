import { Prisma, type AuditAction } from '@prisma/client';

import prisma from '../../lib/prisma';

function serialize(value: Record<string, unknown> | null): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function createAuditLogEntry(params: {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId?: string | undefined;
  opportunityId?: string | null | undefined;
  changes?: Record<string, unknown> | null | undefined;
}) {
  const data: Prisma.AuditLogCreateInput = {
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
  };

  if (params.actorId) {
    data.user = { connect: { id: params.actorId } };
  }
  if (params.opportunityId) {
    data.opportunity = { connect: { id: params.opportunityId } };
  }
  if (params.changes !== undefined) {
    data.changes = serialize(params.changes);
  }

  await prisma.auditLog.create({ data });
}
