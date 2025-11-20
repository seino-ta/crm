import { Router } from 'express';
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
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate());

router.get('/', async (req, res, next) => {
  try {
    const parsed = activityFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }

    const result = await listActivities(parsed.data);
    res.json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const activity = await getActivityById(id);
    res.json(successResponse(activity));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createActivitySchema), async (req, res, next) => {
  try {
    const payload = req.body as CreateActivityInput;
    const activity = await createActivity(payload, req.user?.id);
    res.status(201).json(successResponse(activity));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updateActivitySchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const payload = req.body as UpdateActivityInput;
    const activity = await updateActivity(id, payload, req.user?.id);
    res.json(successResponse(activity));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await deleteActivity(id, req.user?.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
