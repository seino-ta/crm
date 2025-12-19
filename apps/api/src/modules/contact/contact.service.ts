import type { Prisma } from '@prisma/client';
import { AuditAction, UserRole } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import type { AuthenticatedUser } from '../../types/runtime';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';
import { createAuditLogEntry } from '../audit-log/audit-log.helper';

import type { ContactListQuery, CreateContactInput, UpdateContactInput } from './contact.schema';

const DEFAULT_ORDER = { createdAt: 'desc' } as const;

type Actor = AuthenticatedUser | undefined;

function assertActor(actor: Actor): asserts actor is AuthenticatedUser {
  if (!actor) {
    throw createError(401, 'Authentication required');
  }
}

async function assertAccountScope(accountId: string, actor: Actor) {
  assertActor(actor);
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER) return;

  const assignment = await prisma.accountAssignment.findFirst({ where: { accountId, userId: actor.id } });
  if (!assignment) {
    throw createError(403, 'Insufficient permissions');
  }
}

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
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { kanaFirstName: { contains: search } },
      { kanaLastName: { contains: search } },
      { email: { contains: search } },
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

export async function createContact(payload: CreateContactInput, actorId?: string) {
  await ensureAccountExists(payload.accountId);

  const contact = await prisma.contact.create({
    data: {
      accountId: payload.accountId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      kanaFirstName: payload.kanaFirstName ?? null,
      kanaLastName: payload.kanaLastName ?? null,
      email: payload.email,
      phone: payload.phone ?? null,
      jobTitle: payload.jobTitle ?? null,
      linkedin: payload.linkedin ?? null,
      notes: payload.notes ?? null,
    },
  });
  await createAuditLogEntry({
    entityType: 'Contact',
    entityId: contact.id,
    action: AuditAction.CREATE,
    actorId,
    changes: payload,
  });
  return contact;
}

export async function updateContact(id: string, payload: UpdateContactInput, actorId?: string) {
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
  if (payload.kanaFirstName !== undefined) data.kanaFirstName = payload.kanaFirstName ?? null;
  if (payload.kanaLastName !== undefined) data.kanaLastName = payload.kanaLastName ?? null;
  if (payload.phone !== undefined) data.phone = payload.phone ?? null;
  if (payload.jobTitle !== undefined) data.jobTitle = payload.jobTitle ?? null;
  if (payload.linkedin !== undefined) data.linkedin = payload.linkedin ?? null;
  if (payload.notes !== undefined) data.notes = payload.notes ?? null;

  const contact = await prisma.contact.update({
    where: { id },
    data,
  });
  await createAuditLogEntry({
    entityType: 'Contact',
    entityId: id,
    action: AuditAction.UPDATE,
    actorId,
    changes: payload,
  });
  return contact;
}

export async function softDeleteContact(id: string, actor?: Actor) {
  const contact = await getContactById(id);
  await assertAccountScope(contact.accountId, actor);

  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await createAuditLogEntry({
    entityType: 'Contact',
    entityId: id,
    action: AuditAction.DELETE,
    actorId: actor?.id,
  });
}
