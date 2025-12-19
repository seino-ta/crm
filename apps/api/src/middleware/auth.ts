import type { UserRole } from '@prisma/client';
import type { MiddlewareHandler } from 'hono';
import createError from 'http-errors';

import type { AppBindings, AppVariables } from '../types/runtime';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate = (allowedRoles?: UserRole[]): MiddlewareHandler<{ Bindings: AppBindings; Variables: AppVariables }> =>
  (c, next) => {
    const header = c.req.header('authorization');

    if (!header?.startsWith('Bearer ')) {
      throw createError(401, 'Authorization header missing');
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      throw createError(403, 'Insufficient permissions');
    }

    c.set('user', {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return next();
  };
