import { AuditAction, Prisma, UserRole } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';
import { createAuditLogEntry } from '../audit-log/audit-log.helper';

import type {
  ActivityFilterInput,
  CreateActivityInput,
  UpdateActivityInput,
} from './activity.schema';

type Actor = Express.AuthenticatedUser | undefined;

function assertActor(actor: Actor) {
  if (!actor) {
    throw createError(401, 'Authentication required');
  }
}

function assertOwnerOrManager(actor: Actor, ownerId: string) {
  assertActor(actor);
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER) return;
  if (actor.id !== ownerId) {
    throw createError(403, 'Insufficient permissions');
  }
}

async function ensureUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw createError(404, 'User not found');
  }
}

async function ensureAccount(accountId?: string) {
  if (!accountId) return;
  const account = await prisma.account.findFirst({ where: { id: accountId, deletedAt: null } });
  if (!account) {
    throw createError(404, 'Account not found');
  }
}

async function ensureContact(contactId?: string) {
  if (!contactId) return;
  const contact = await prisma.contact.findFirst({ where: { id: contactId, deletedAt: null } });
  if (!contact) {
    throw createError(404, 'Contact not found');
  }
}

async function ensureOpportunity(opportunityId?: string) {
  if (!opportunityId) return;
  const opportunity = await prisma.opportunity.findFirst({ where: { id: opportunityId, deletedAt: null } });
  if (!opportunity) {
    throw createError(404, 'Opportunity not found');
  }
}

export async function listActivities(filters: ActivityFilterInput) {
  const { type, userId, accountId, contactId, opportunityId, from, to, page, pageSize } = filters;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.ActivityWhereInput = {};

  if (type) where.type = type;
  if (userId) where.userId = userId;
  if (accountId) where.accountId = accountId;
  if (contactId) where.contactId = contactId;
  if (opportunityId) where.opportunityId = opportunityId;
  if (from || to) {
    const occurredAt: Prisma.DateTimeFilter<'Activity'> = {};
    if (from) occurredAt.gte = from;
    if (to) occurredAt.lte = to;
    where.occurredAt = occurredAt;
  }

  if (!accountId) {
    where.OR = [{ accountId: null }, { account: { deletedAt: null } }];
  }

  const [total, data] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip,
      take,
      include: {
        user: true,
        account: true,
        contact: true,
        opportunity: true,
      },
    }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize),
  };
}

export async function getActivityById(id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      user: true,
      account: true,
      contact: true,
      opportunity: true,
    },
  });

  if (!activity) {
    throw createError(404, 'Activity not found');
  }

  return activity;
}

export async function createActivity(payload: CreateActivityInput, actor?: Actor) {
  assertOwnerOrManager(actor, payload.userId);
  await Promise.all([
    ensureUser(payload.userId),
    ensureAccount(payload.accountId),
    ensureContact(payload.contactId),
    ensureOpportunity(payload.opportunityId),
  ]);

  const data: Prisma.ActivityCreateInput = {
    type: payload.type,
    subject: payload.subject,
    description: payload.description ?? null,
    occurredAt: payload.occurredAt ?? new Date(),
    user: { connect: { id: payload.userId } },
  };

  if (payload.accountId) data.account = { connect: { id: payload.accountId } };
  if (payload.contactId) data.contact = { connect: { id: payload.contactId } };
  if (payload.opportunityId) data.opportunity = { connect: { id: payload.opportunityId } };

  const activity = await prisma.activity.create({
    data,
    include: { user: true, account: true, contact: true, opportunity: true },
  });
  await createAuditLogEntry({
    entityType: 'Activity',
    entityId: activity.id,
    action: AuditAction.CREATE,
    actorId: actor?.id,
    opportunityId: activity.opportunityId ?? undefined,
    changes: payload,
  });
  return activity;
}

export async function updateActivity(id: string, payload: UpdateActivityInput, actor?: Actor) {
  const existing = await getActivityById(id);
  assertOwnerOrManager(actor, existing.userId);

  if (payload.userId && actor?.role === UserRole.REP && payload.userId !== existing.userId) {
    throw createError(403, 'Insufficient permissions');
  }

  await Promise.all([
    payload.userId && payload.userId !== existing.userId ? ensureUser(payload.userId) : Promise.resolve(),
    payload.accountId && payload.accountId !== existing.accountId ? ensureAccount(payload.accountId) : Promise.resolve(),
    payload.contactId && payload.contactId !== existing.contactId ? ensureContact(payload.contactId) : Promise.resolve(),
    payload.opportunityId && payload.opportunityId !== existing.opportunityId
      ? ensureOpportunity(payload.opportunityId)
      : Promise.resolve(),
  ]);

  const data: Prisma.ActivityUpdateInput = {};

  if (payload.type !== undefined) data.type = payload.type;
  if (payload.subject !== undefined) data.subject = payload.subject;
  if (payload.description !== undefined) data.description = payload.description ?? null;
  if (payload.occurredAt !== undefined) data.occurredAt = payload.occurredAt;
  if (payload.userId !== undefined) data.user = { connect: { id: payload.userId } };
  if (payload.accountId !== undefined) {
    data.account = payload.accountId ? { connect: { id: payload.accountId } } : { disconnect: true };
  }
  if (payload.contactId !== undefined) {
    data.contact = payload.contactId ? { connect: { id: payload.contactId } } : { disconnect: true };
  }
  if (payload.opportunityId !== undefined) {
    data.opportunity = payload.opportunityId ? { connect: { id: payload.opportunityId } } : { disconnect: true };
  }

  const activity = await prisma.activity.update({
    where: { id },
    data,
    include: { user: true, account: true, contact: true, opportunity: true },
  });
  await createAuditLogEntry({
    entityType: 'Activity',
    entityId: id,
    action: AuditAction.UPDATE,
    actorId: actor?.id,
    opportunityId: activity.opportunityId ?? undefined,
    changes: payload,
  });
  return activity;
}

export async function deleteActivity(id: string, actor?: Actor) {
  const existing = await getActivityById(id);
  assertOwnerOrManager(actor, existing.userId);
  await prisma.activity.delete({ where: { id } });
  await createAuditLogEntry({
    entityType: 'Activity',
    entityId: id,
    action: AuditAction.DELETE,
    actorId: actor?.id,
    opportunityId: existing.opportunityId ?? undefined,
  });
}
