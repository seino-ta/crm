import { UserRole } from '@prisma/client';
import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { auditLogFilterSchema } from '../modules/audit-log/audit-log.schema';
import { listAuditLogs } from '../modules/audit-log/audit-log.service';
import type { AppEnv } from '../types/runtime';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate([UserRole.ADMIN]));

router.get('/', async (c) => {
  const parsed = auditLogFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }

  const { data, meta } = await listAuditLogs(parsed.data);
  return c.json(successResponse(data, meta));
});

export default router;
