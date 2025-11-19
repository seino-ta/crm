import type { Prisma } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';

import type {
  ActivityFilterInput,
  CreateActivityInput,
  UpdateActivityInput,
} from './activity.schema';

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

export async function createActivity(payload: CreateActivityInput) {
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

  return prisma.activity.create({
    data,
    include: { user: true, account: true, contact: true, opportunity: true },
  });
}

export async function updateActivity(id: string, payload: UpdateActivityInput) {
  const existing = await getActivityById(id);

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

  return prisma.activity.update({
    where: { id },
    data,
    include: { user: true, account: true, contact: true, opportunity: true },
  });
}

export async function deleteActivity(id: string) {
  await getActivityById(id);
  await prisma.activity.delete({ where: { id } });
}
