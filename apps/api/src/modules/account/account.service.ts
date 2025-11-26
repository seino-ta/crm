import { AuditAction, Prisma } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';
import { createAuditLogEntry } from '../audit-log/audit-log.helper';

import type { AccountListQuery, CreateAccountInput, UpdateAccountInput } from './account.schema';

const DEFAULT_ORDER = { createdAt: 'desc' } as const;

type AccountFetchOptions = {
  includeDeleted?: boolean;
};

async function findAccountOrThrow(id: string, { includeDeleted }: AccountFetchOptions = {}) {
  const where: Prisma.AccountWhereInput = { id };
  if (!includeDeleted) {
    where.deletedAt = null;
  }

  const account = await prisma.account.findFirst({ where });
  if (!account) {
    throw createError(404, 'Account not found');
  }
  return account;
}

export async function listAccounts(query: AccountListQuery) {
  const { search, status, archived, page, pageSize } = query;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.AccountWhereInput = {
    deletedAt: archived ? { not: null } : null,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
      { industry: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.account.count({ where }),
    prisma.account.findMany({ where, orderBy: DEFAULT_ORDER, skip, take }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize),
  };
}

export async function getAccountById(id: string, options?: AccountFetchOptions) {
  return findAccountOrThrow(id, options);
}

export async function createAccount(payload: CreateAccountInput, actorId?: string) {
  const data: Prisma.AccountCreateInput = {
    name: payload.name,
    domain: payload.domain ?? null,
    industry: payload.industry ?? null,
    website: payload.website ?? null,
    size: payload.size ?? null,
    description: payload.description ?? null,
    phone: payload.phone ?? null,
  };

  if (payload.status) {
    data.status = payload.status;
  }

  if (payload.annualRevenue !== undefined) {
    data.annualRevenue = new Prisma.Decimal(payload.annualRevenue);
  }

  const account = await prisma.account.create({ data });
  await createAuditLogEntry({
    entityType: 'Account',
    entityId: account.id,
    action: AuditAction.CREATE,
    actorId,
    changes: payload,
  });
  return account;
}

export async function updateAccount(id: string, payload: UpdateAccountInput, actorId?: string) {
  await findAccountOrThrow(id);

  const data: Prisma.AccountUpdateInput = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.domain !== undefined) data.domain = payload.domain ?? null;
  if (payload.industry !== undefined) data.industry = payload.industry ?? null;
  if (payload.website !== undefined) data.website = payload.website ?? null;
  if (payload.size !== undefined) data.size = payload.size ?? null;
  if (payload.description !== undefined) data.description = payload.description ?? null;
  if (payload.phone !== undefined) data.phone = payload.phone ?? null;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.annualRevenue !== undefined) {
    data.annualRevenue = new Prisma.Decimal(payload.annualRevenue);
  }

  const account = await prisma.account.update({ where: { id }, data });
  await createAuditLogEntry({
    entityType: 'Account',
    entityId: id,
    action: AuditAction.UPDATE,
    actorId,
    changes: payload,
  });
  return account;
}

export async function softDeleteAccount(id: string, actorId?: string) {
  await findAccountOrThrow(id);

  await prisma.account.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await createAuditLogEntry({
    entityType: 'Account',
    entityId: id,
    action: AuditAction.DELETE,
    actorId,
  });
}

export async function restoreAccount(id: string, actorId?: string) {
  const account = await findAccountOrThrow(id, { includeDeleted: true });
  if (!account.deletedAt) {
    throw createError(400, 'Account is not archived');
  }

  const restored = await prisma.account.update({
    where: { id },
    data: { deletedAt: null },
  });

  await createAuditLogEntry({
    entityType: 'Account',
    entityId: id,
    action: AuditAction.UPDATE,
    actorId,
    changes: { restored: true },
  });

  return restored;
}
