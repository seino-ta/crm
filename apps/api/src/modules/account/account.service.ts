import { AccountAssignmentRole, AuditAction, Prisma, UserRole } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import type { AuthenticatedUser } from '../../types/runtime';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';
import { createAuditLogEntry } from '../audit-log/audit-log.helper';

import type { AccountListQuery, CreateAccountInput, UpdateAccountInput } from './account.schema';

const DEFAULT_ORDER = { createdAt: 'desc' } as const;

type AccountFetchOptions = {
  includeDeleted?: boolean;
};

type Actor = AuthenticatedUser | undefined;

function assertActor(actor: Actor): asserts actor is AuthenticatedUser {
  if (!actor) {
    throw createError(401, 'Authentication required');
  }
}

function assertAccountManagePermission(_accountId: string, actor: Actor) {
  assertActor(actor);
  if (actor.role !== UserRole.ADMIN) {
    throw createError(403, 'Insufficient permissions');
  }
}

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
      { name: { contains: search } },
      { domain: { contains: search } },
      { industry: { contains: search } },
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

export async function createAccount(payload: CreateAccountInput, actor?: Actor) {
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

  if (actor) {
    data.assignments = {
      create: {
        user: { connect: { id: actor.id } },
        role: AccountAssignmentRole.OWNER,
      },
    };
  }

  const account = await prisma.account.create({ data });
  await createAuditLogEntry({
    entityType: 'Account',
    entityId: account.id,
    action: AuditAction.CREATE,
    actorId: actor?.id,
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

export async function softDeleteAccount(id: string, actor?: Actor) {
  await findAccountOrThrow(id);
  assertAccountManagePermission(id, actor);

  await prisma.account.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await createAuditLogEntry({
    entityType: 'Account',
    entityId: id,
    action: AuditAction.DELETE,
    actorId: actor?.id,
  });
}

export async function restoreAccount(id: string, actor?: Actor) {
  const account = await findAccountOrThrow(id, { includeDeleted: true });
  if (!account.deletedAt) {
    throw createError(400, 'Account is not archived');
  }

  assertAccountManagePermission(id, actor);

  const restored = await prisma.account.update({
    where: { id },
    data: { deletedAt: null },
  });

  await createAuditLogEntry({
    entityType: 'Account',
    entityId: id,
    action: AuditAction.UPDATE,
    actorId: actor?.id,
    changes: { restored: true },
  });

  return restored;
}
