import { AuditAction, type Prisma } from '@prisma/client';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import createError from 'http-errors';

import env from '../../config/env';
import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';
import { createAuditLogEntry } from '../audit-log/audit-log.helper';

import type { InviteUserInput, UpdateUserInput, UpdateUserStatusInput, UserFilterQuery } from './user.schema';

const DEFAULT_ORDER = { createdAt: 'desc' } as const;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  title: true,
  phone: true,
  role: true,
  isActive: true,
  invitedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

function generateTemporaryPassword() {
  return crypto.randomBytes(6).toString('base64url');
}

export async function listUsers(query: UserFilterQuery) {
  const { search, role, status, page, pageSize } = query;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) {
    where.role = role;
  }
  if (status) {
    where.isActive = status === 'active';
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: DEFAULT_ORDER, skip, take, select: userSelect }),
  ]);

  return { data: users, meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize) };
}

export async function inviteUser(payload: InviteUserInput, actorId?: string) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw createError(409, 'Email is already registered');
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, env.security.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      title: payload.title ?? null,
      phone: payload.phone ?? null,
      role: payload.role,
      invitedAt: new Date(),
      isActive: true,
    },
    select: userSelect,
  });

  await createAuditLogEntry({
    entityType: 'User',
    entityId: user.id,
    action: AuditAction.CREATE,
    actorId,
    changes: { ...payload, temporaryPassword },
  });

  return { user, temporaryPassword };
}

export async function updateUser(id: string, payload: UpdateUserInput, actorId?: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw createError(404, 'User not found');
  }

  const data: Prisma.UserUpdateInput = {};
  if (payload.firstName !== undefined) data.firstName = payload.firstName ?? null;
  if (payload.lastName !== undefined) data.lastName = payload.lastName ?? null;
  if (payload.title !== undefined) data.title = payload.title ?? null;
  if (payload.phone !== undefined) data.phone = payload.phone ?? null;
  if (payload.role !== undefined) data.role = payload.role;
  if (payload.isActive !== undefined) data.isActive = payload.isActive;

  const user = await prisma.user.update({ where: { id }, data, select: userSelect });

  await createAuditLogEntry({
    entityType: 'User',
    entityId: id,
    action: AuditAction.UPDATE,
    actorId,
    changes: payload,
  });

  return user;
}

export async function updateUserStatus(id: string, payload: UpdateUserStatusInput, actorId?: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw createError(404, 'User not found');
  }
  if (actorId && actorId === existing.id && payload.isActive === false) {
    throw createError(400, 'You cannot deactivate your own account');
  }

  const user = await prisma.user.update({ where: { id }, data: { isActive: payload.isActive }, select: userSelect });

  await createAuditLogEntry({
    entityType: 'User',
    entityId: id,
    action: payload.isActive ? AuditAction.UPDATE : AuditAction.DELETE,
    actorId,
    changes: { isActive: payload.isActive },
  });

  return user;
}
