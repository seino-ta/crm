import { Prisma } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';

import type { AccountListQuery, CreateAccountInput, UpdateAccountInput } from './account.schema';

const DEFAULT_ORDER = { createdAt: 'desc' } as const;

export async function listAccounts(query: AccountListQuery) {
  const { search, status, page, pageSize } = query;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.AccountWhereInput = {
    deletedAt: null,
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

export async function getAccountById(id: string) {
  const account = await prisma.account.findFirst({ where: { id, deletedAt: null } });

  if (!account) {
    throw createError(404, 'Account not found');
  }

  return account;
}

export async function createAccount(payload: CreateAccountInput) {
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

  return prisma.account.create({ data });
}

export async function updateAccount(id: string, payload: UpdateAccountInput) {
  await getAccountById(id);

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

  return prisma.account.update({ where: { id }, data });
}

export async function softDeleteAccount(id: string) {
  await getAccountById(id);

  await prisma.account.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
