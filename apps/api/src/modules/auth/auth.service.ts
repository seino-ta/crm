import { UserRole, type User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import createError from 'http-errors';

import env from '../../config/env';
import prisma from '../../lib/prisma';
import { signAccessToken } from '../../utils/jwt';

import type { LoginInput, SignupInput } from './auth.schema';

const DEFAULT_ROLE = UserRole.REP;

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function signupUser(payload: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });

  if (existing) {
    throw createError(409, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(payload.password, env.security.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      role: payload.role ?? DEFAULT_ROLE,
    },
  });

  const token = signAccessToken({ id: user.id, email: user.email, role: user.role });

  return { token, user: sanitizeUser(user) };
}

export async function loginUser(payload: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    throw createError(401, 'Invalid credentials');
  }

  const isValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isValid) {
    throw createError(401, 'Invalid credentials');
  }

  const token = signAccessToken({ id: user.id, email: user.email, role: user.role });

  return { token, user: sanitizeUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw createError(404, 'User not found');
  }

  return sanitizeUser(user);
}
