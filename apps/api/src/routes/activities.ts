import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  activityFilterSchema,
  createActivitySchema,
  updateActivitySchema,
  type CreateActivityInput,
  type UpdateActivityInput,
} from '../modules/activity/activity.schema';
import {
  createActivity,
  deleteActivity,
  getActivityById,
  listActivities,
  updateActivity,
} from '../modules/activity/activity.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/', async (c) => {
  const parsed = activityFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }

  const result = await listActivities(parsed.data);
  return c.json(successResponse(result.data, result.meta));
});

router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const activity = await getActivityById(id);
  return c.json(successResponse(activity));
});

router.post('/', validateBody(createActivitySchema), async (c) => {
  const payload = getValidatedBody<CreateActivityInput>(c);
  const activity = await createActivity(payload, requireUser(c));
  return c.json(successResponse(activity), 201);
});

router.put('/:id', validateBody(updateActivitySchema), async (c) => {
  const { id } = c.req.param();
  const payload = getValidatedBody<UpdateActivityInput>(c);
  const activity = await updateActivity(id, payload, requireUser(c));
  return c.json(successResponse(activity));
});

router.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await deleteActivity(id, requireUser(c));
  return c.body(null, 204);
});

export default router;
