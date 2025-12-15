import type { Prisma } from '@prisma/client';
import { AuditAction, TaskStatus, UserRole } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';
import { createAuditLogEntry } from '../audit-log/audit-log.helper';

import type { CreateTaskInput, TaskFilterInput, UpdateTaskInput } from './task.schema';

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

function assertCreateScope(actor: Actor, ownerId: string) {
  assertActor(actor);
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER) return;
  if (actor.id !== ownerId) throw createError(403, 'Insufficient permissions');
}

async function ensureUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError(404, 'User not found');
}

async function ensureAccount(accountId?: string) {
  if (!accountId) return;
  const account = await prisma.account.findFirst({ where: { id: accountId, deletedAt: null } });
  if (!account) throw createError(404, 'Account not found');
}

async function ensureOpportunity(opportunityId?: string) {
  if (!opportunityId) return;
  const opportunity = await prisma.opportunity.findFirst({ where: { id: opportunityId, deletedAt: null } });
  if (!opportunity) throw createError(404, 'Opportunity not found');
}

async function ensureActivity(activityId?: string) {
  if (!activityId) return;
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw createError(404, 'Activity not found');
}

async function ensureContact(contactId?: string) {
  if (!contactId) return;
  const contact = await prisma.contact.findFirst({ where: { id: contactId, deletedAt: null } });
  if (!contact) throw createError(404, 'Contact not found');
}

export async function listTasks(filters: TaskFilterInput) {
  const { search, status, ownerId, accountId, opportunityId, activityId, dueBefore, dueAfter, page, pageSize } = filters;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.TaskWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      {
        owner: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }
  if (status) where.status = status;
  if (ownerId) where.ownerId = ownerId;
  if (accountId) where.accountId = accountId;
  if (opportunityId) where.opportunityId = opportunityId;
  if (activityId) where.activityId = activityId;
  if (dueBefore || dueAfter) {
    const dueDate: Prisma.DateTimeNullableFilter<'Task'> = {};
    if (dueAfter) dueDate.gte = dueAfter;
    if (dueBefore) dueDate.lte = dueBefore;
    where.dueDate = dueDate;
  }

  if (!accountId) {
    where.OR = [{ accountId: null }, { account: { deletedAt: null } }];
  }

  const [total, data] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        owner: true,
        account: true,
        opportunity: true,
        activity: true,
        contact: true,
      },
    }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize),
  };
}

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      owner: true,
      account: true,
      opportunity: true,
      activity: true,
      contact: true,
    },
  });

  if (!task) throw createError(404, 'Task not found');
  return task;
}

export async function createTask(payload: CreateTaskInput, actor?: Actor) {
  assertCreateScope(actor, payload.ownerId);
  await Promise.all([
    ensureUser(payload.ownerId),
    ensureAccount(payload.accountId),
    ensureOpportunity(payload.opportunityId),
    ensureActivity(payload.activityId),
    ensureContact(payload.contactId),
  ]);

  const data: Prisma.TaskCreateInput = {
    title: payload.title,
    description: payload.description ?? null,
    status: payload.status ?? TaskStatus.OPEN,
    owner: { connect: { id: payload.ownerId } },
  };

  if (payload.priority !== undefined) data.priority = payload.priority;
  if (payload.dueDate !== undefined) data.dueDate = payload.dueDate;

  if (payload.activityId) data.activity = { connect: { id: payload.activityId } };
  if (payload.accountId) data.account = { connect: { id: payload.accountId } };
  if (payload.opportunityId) data.opportunity = { connect: { id: payload.opportunityId } };
  if (payload.contactId) data.contact = { connect: { id: payload.contactId } };

  const task = await prisma.task.create({
    data,
    include: {
      owner: true,
      account: true,
      opportunity: true,
      activity: true,
      contact: true,
    },
  });
  await createAuditLogEntry({
    entityType: 'Task',
    entityId: task.id,
    action: AuditAction.CREATE,
    actorId: actor?.id,
    opportunityId: task.opportunityId ?? undefined,
    changes: payload,
  });
  return task;
}

export async function updateTask(id: string, payload: UpdateTaskInput, actor?: Actor) {
  const existing = await getTaskById(id);
  assertOwnerOrManager(actor, existing.ownerId);

  if (payload.ownerId && actor?.role === UserRole.REP && payload.ownerId !== existing.ownerId) {
    throw createError(403, 'Insufficient permissions');
  }

  await Promise.all([
    payload.ownerId && payload.ownerId !== existing.ownerId ? ensureUser(payload.ownerId) : Promise.resolve(),
    payload.accountId && payload.accountId !== existing.accountId ? ensureAccount(payload.accountId) : Promise.resolve(),
    payload.opportunityId && payload.opportunityId !== existing.opportunityId
      ? ensureOpportunity(payload.opportunityId)
      : Promise.resolve(),
    payload.activityId && payload.activityId !== existing.activityId
      ? ensureActivity(payload.activityId)
      : Promise.resolve(),
    payload.contactId && payload.contactId !== existing.contactId
      ? ensureContact(payload.contactId)
      : Promise.resolve(),
  ]);

  const data: Prisma.TaskUpdateInput = {};

  if (payload.title !== undefined) data.title = payload.title;
  if (payload.description !== undefined) data.description = payload.description ?? null;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.priority !== undefined) data.priority = payload.priority;
  if (payload.dueDate !== undefined) data.dueDate = payload.dueDate;
  if (payload.ownerId !== undefined) data.owner = { connect: { id: payload.ownerId } };
  if (payload.activityId !== undefined) {
    data.activity = payload.activityId ? { connect: { id: payload.activityId } } : { disconnect: true };
  }
  if (payload.accountId !== undefined) {
    data.account = payload.accountId ? { connect: { id: payload.accountId } } : { disconnect: true };
  }
  if (payload.opportunityId !== undefined) {
    data.opportunity = payload.opportunityId ? { connect: { id: payload.opportunityId } } : { disconnect: true };
  }
  if (payload.contactId !== undefined) {
    data.contact = payload.contactId ? { connect: { id: payload.contactId } } : { disconnect: true };
  }

  if (payload.status !== undefined && payload.status === TaskStatus.COMPLETED && !existing.completedAt) {
    data.completedAt = new Date();
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      owner: true,
      account: true,
      opportunity: true,
      activity: true,
      contact: true,
    },
  });
  await createAuditLogEntry({
    entityType: 'Task',
    entityId: id,
    action: AuditAction.UPDATE,
    actorId: actor?.id,
    opportunityId: task.opportunityId ?? undefined,
    changes: payload,
  });
  return task;
}

export async function deleteTask(id: string, actor?: Actor) {
  const existing = await getTaskById(id);
  assertOwnerOrManager(actor, existing.ownerId);
  await prisma.task.delete({ where: { id } });
  await createAuditLogEntry({
    entityType: 'Task',
    entityId: id,
    action: AuditAction.DELETE,
    actorId: actor?.id,
    opportunityId: existing.opportunityId ?? undefined,
  });
}
