import { AuditAction, Prisma, UserRole } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';
import { createAuditLogEntry } from '../audit-log/audit-log.helper';

import type { CreateLeadInput, LeadListQuery, UpdateLeadInput } from './lead.schema';

type Actor = Express.AuthenticatedUser | undefined;

function assertActor(actor: Actor): asserts actor is Express.AuthenticatedUser {
  if (!actor) throw createError(401, 'Authentication required');
}

function assertOwnerOrManager(actor: Actor, ownerId: string) {
  assertActor(actor);
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER) return;
  if (actor.id !== ownerId) throw createError(403, 'Insufficient permissions');
}

async function ensureOwner(ownerId: string) {
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) throw createError(404, 'Owner not found');
}

async function ensureAccount(accountId?: string) {
  if (!accountId) return;
  const account = await prisma.account.findFirst({ where: { id: accountId, deletedAt: null } });
  if (!account) throw createError(404, 'Account not found');
}

export async function listLeads(query: LeadListQuery) {
  const { search, status, ownerId, page, pageSize } = query;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.LeadWhereInput = { deletedAt: null };

  if (status) where.status = status;
  if (ownerId) where.ownerId = ownerId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        owner: true,
        account: true,
      },
    }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize),
  };
}

export async function getLeadById(id: string) {
  const lead = await prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: { owner: true, account: true },
  });

  if (!lead) throw createError(404, 'Lead not found');
  return lead;
}

export async function createLead(payload: CreateLeadInput, actor?: Actor) {
  assertOwnerOrManager(actor, payload.ownerId);
  await ensureOwner(payload.ownerId);
  await ensureAccount(payload.accountId);

  const data: Prisma.LeadCreateInput = {
    name: payload.name,
    company: payload.company ?? null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    source: payload.source ?? null,
    notes: payload.notes ?? null,
    owner: { connect: { id: payload.ownerId } },
  };

  if (payload.status) data.status = payload.status;

  if (payload.accountId) data.account = { connect: { id: payload.accountId } };

  const lead = await prisma.lead.create({ data, include: { owner: true, account: true } });

  await createAuditLogEntry({
    entityType: 'Lead',
    entityId: lead.id,
    action: AuditAction.CREATE,
    ...(actor?.id ? { actorId: actor.id } : {}),
    changes: payload,
  });

  return lead;
}

export async function updateLead(id: string, payload: UpdateLeadInput, actor?: Actor) {
  const existing = await getLeadById(id);
  assertOwnerOrManager(actor, existing.ownerId);

  if (payload.ownerId && actor?.role === UserRole.REP && payload.ownerId !== existing.ownerId) {
    throw createError(403, 'Insufficient permissions');
  }

  if (payload.ownerId && payload.ownerId !== existing.ownerId) await ensureOwner(payload.ownerId);
  if (payload.accountId && payload.accountId !== existing.accountId) await ensureAccount(payload.accountId);

  const data: Prisma.LeadUpdateInput = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.company !== undefined) data.company = payload.company ?? null;
  if (payload.email !== undefined) data.email = payload.email ?? null;
  if (payload.phone !== undefined) data.phone = payload.phone ?? null;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.source !== undefined) data.source = payload.source ?? null;
  if (payload.notes !== undefined) data.notes = payload.notes ?? null;
  if (payload.ownerId !== undefined) data.owner = { connect: { id: payload.ownerId } };
  if (payload.accountId !== undefined) {
    data.account = payload.accountId ? { connect: { id: payload.accountId } } : { disconnect: true };
  }

  const lead = await prisma.lead.update({ where: { id }, data, include: { owner: true, account: true } });

  await createAuditLogEntry({
    entityType: 'Lead',
    entityId: id,
    action: AuditAction.UPDATE,
    ...(actor?.id ? { actorId: actor.id } : {}),
    changes: payload,
  });

  return lead;
}

export async function softDeleteLead(id: string, actor?: Actor) {
  const existing = await getLeadById(id);
  assertOwnerOrManager(actor, existing.ownerId);

  await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });

  await createAuditLogEntry({
    entityType: 'Lead',
    entityId: id,
    action: AuditAction.DELETE,
    ...(actor?.id ? { actorId: actor.id } : {}),
  });
}
