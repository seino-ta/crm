import type { Prisma } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';

import type { ContactListQuery, CreateContactInput, UpdateContactInput } from './contact.schema';

const DEFAULT_ORDER = { createdAt: 'desc' } as const;

async function ensureAccountExists(accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, deletedAt: null } });
  if (!account) {
    throw createError(404, 'Account not found');
  }
}

export async function listContacts(query: ContactListQuery) {
  const { search, accountId, page, pageSize } = query;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.ContactWhereInput = {
    deletedAt: null,
  };

  if (accountId) {
    where.accountId = accountId;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({ where, orderBy: DEFAULT_ORDER, skip, take, include: { account: true } }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize),
  };
}

export async function getContactById(id: string) {
  const contact = await prisma.contact.findFirst({ where: { id, deletedAt: null }, include: { account: true } });

  if (!contact) {
    throw createError(404, 'Contact not found');
  }

  return contact;
}

export async function createContact(payload: CreateContactInput) {
  await ensureAccountExists(payload.accountId);

  return prisma.contact.create({
    data: {
      accountId: payload.accountId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone ?? null,
      jobTitle: payload.jobTitle ?? null,
      linkedin: payload.linkedin ?? null,
      notes: payload.notes ?? null,
    },
  });
}

export async function updateContact(id: string, payload: UpdateContactInput) {
  const existing = await getContactById(id);

  if (payload.accountId && payload.accountId !== existing.accountId) {
    await ensureAccountExists(payload.accountId);
  }

  const data: Prisma.ContactUpdateInput = {};

  if (payload.accountId !== undefined) {
    data.account = { connect: { id: payload.accountId } };
  }
  if (payload.firstName !== undefined) data.firstName = payload.firstName;
  if (payload.lastName !== undefined) data.lastName = payload.lastName;
  if (payload.email !== undefined) data.email = payload.email;
  if (payload.phone !== undefined) data.phone = payload.phone ?? null;
  if (payload.jobTitle !== undefined) data.jobTitle = payload.jobTitle ?? null;
  if (payload.linkedin !== undefined) data.linkedin = payload.linkedin ?? null;
  if (payload.notes !== undefined) data.notes = payload.notes ?? null;

  return prisma.contact.update({
    where: { id },
    data,
  });
}

export async function softDeleteContact(id: string) {
  await getContactById(id);

  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
