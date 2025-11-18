import { UserRole } from '@prisma/client';
import { Router } from 'express';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { auditLogFilterSchema } from '../modules/audit-log/audit-log.schema';
import { listAuditLogs } from '../modules/audit-log/audit-log.service';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate([UserRole.ADMIN, UserRole.MANAGER]));

router.get('/', async (req, res, next) => {
  try {
    const parsed = auditLogFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }

    const { data, meta } = await listAuditLogs(parsed.data);
    res.json(successResponse(data, meta));
  } catch (error) {
    next(error);
  }
});

export default router;
