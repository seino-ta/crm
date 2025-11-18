import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import { ownerPipelineReport, stageSummaryReport } from '../modules/report/report.service';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate([UserRole.ADMIN, UserRole.MANAGER]));

router.get('/pipeline-stage', async (_req, res, next) => {
  try {
    const data = await stageSummaryReport();
    res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
});

router.get('/owner', async (_req, res, next) => {
  try {
    const data = await ownerPipelineReport();
    res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
});

export default router;
