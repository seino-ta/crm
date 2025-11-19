import type { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';

import { verifyAccessToken } from '../utils/jwt';

export const authenticate = (allowedRoles?: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      next(createError(401, 'Authorization header missing'));
      return;
    }

    const token = header.slice(7);

    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        next(createError(403, 'Insufficient permissions'));
        return;
      }

      next();
    } catch {
      next(createError(401, 'Invalid or expired token'));
    }
  };
