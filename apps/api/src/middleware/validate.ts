import type { MiddlewareHandler } from 'hono';
import createError from 'http-errors';
import type { ZodSchema } from 'zod';

import type { AppBindings, AppVariables } from '../types/runtime';

export const validateBody = <T>(schema: ZodSchema<T>): MiddlewareHandler<{ Bindings: AppBindings; Variables: AppVariables }> =>
  async (c, next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      throw createError(400, 'Invalid JSON payload');
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw createError(422, 'Validation error', { details: parsed.error.flatten() });
    }
    c.set('validatedBody', parsed.data);
    await next();
  };
