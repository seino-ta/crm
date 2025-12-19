import { Hono } from 'hono';

import { authenticate } from '../middleware/auth';
import { ownerPipelineReport, stageSummaryReport } from '../modules/report/report.service';
import type { AppEnv } from '../types/runtime';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/pipeline-stage', async (c) => {
  const data = await stageSummaryReport();
  return c.json(successResponse(data));
});

router.get('/owner', async (c) => {
  const data = await ownerPipelineReport();
  return c.json(successResponse(data));
});

export default router;
