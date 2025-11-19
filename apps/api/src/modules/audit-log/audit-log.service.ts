import type { Prisma } from '@prisma/client';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';

import type { AuditLogFilter } from './audit-log.schema';

export async function listAuditLogs(filters: AuditLogFilter) {
  const { entityType, entityId, userId, opportunityId, action, from, to, page, pageSize } = filters;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.AuditLogWhereInput = {};

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;
  if (opportunityId) where.opportunityId = opportunityId;
  if (action) where.action = action;
  if (from || to) {
    const createdAt: Prisma.DateTimeFilter<'AuditLog'> = {};
    if (from) createdAt.gte = from;
    if (to) createdAt.lte = to;
    where.createdAt = createdAt;
  }

  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: true,
        opportunity: true,
      },
    }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize),
  };
}
