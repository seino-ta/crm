import { Hono } from 'hono';

import type { AppEnv } from '../types/runtime';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.get('/healthz', (c) => c.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() })));

router.get('/readyz', (c) => c.json(successResponse({ status: 'ready', timestamp: new Date().toISOString() })));

export default router;
