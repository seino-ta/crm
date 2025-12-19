import createError from 'http-errors';

import type { AppContext, AuthenticatedUser } from '../types/runtime';

export function requireUser(c: AppContext): AuthenticatedUser {
  const user = c.get('user');
  if (!user) {
    throw createError(401, 'Authentication required');
  }
  return user;
}

export function getValidatedBody<T>(c: AppContext): T {
  return c.get('validatedBody') as T;
}
