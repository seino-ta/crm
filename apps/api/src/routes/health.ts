import { Router } from 'express';

import { successResponse } from '../utils/response';

const router = Router();

router.get('/healthz', (_req, res) => {
  res.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() }));
});

router.get('/readyz', (_req, res) => {
  res.json(successResponse({ status: 'ready', timestamp: new Date().toISOString() }));
});

export default router;
