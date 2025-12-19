import type { MiddlewareHandler } from 'hono';

import logger from '../lib/logger';
import type { AppBindings, AppVariables } from '../types/runtime';

export const requestLogger: MiddlewareHandler<{ Bindings: AppBindings; Variables: AppVariables }> = async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  }, 'request completed');
};
