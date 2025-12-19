import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createTaskSchema,
  taskFilterSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../modules/task/task.schema';
import { createTask, deleteTask, getTaskById, listTasks, updateTask } from '../modules/task/task.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/', async (c) => {
  const parsed = taskFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }

  const result = await listTasks(parsed.data);
  return c.json(successResponse(result.data, result.meta));
});

router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const task = await getTaskById(id);
  return c.json(successResponse(task));
});

router.post('/', validateBody(createTaskSchema), async (c) => {
  const payload = getValidatedBody<CreateTaskInput>(c);
  const task = await createTask(payload, requireUser(c));
  return c.json(successResponse(task), 201);
});

router.put('/:id', validateBody(updateTaskSchema), async (c) => {
  const { id } = c.req.param();
  const payload = getValidatedBody<UpdateTaskInput>(c);
  const task = await updateTask(id, payload, requireUser(c));
  return c.json(successResponse(task));
});

router.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await deleteTask(id, requireUser(c));
  return c.body(null, 204);
});

export default router;
