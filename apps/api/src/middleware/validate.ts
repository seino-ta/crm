import type { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import type { ZodSchema } from 'zod';

export const validateBody = <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body as unknown);

    if (!result.success) {
      next(createError(422, 'Validation error', { details: result.error.flatten() }));
      return;
    }

    (req as Request & { body: T }).body = result.data;
    next();
  };
