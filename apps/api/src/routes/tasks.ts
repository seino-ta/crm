import { Router } from 'express';
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
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate());

router.get('/', async (req, res, next) => {
  try {
    const parsed = taskFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }

    const result = await listTasks(parsed.data);
    res.json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const task = await getTaskById(id);
    res.json(successResponse(task));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createTaskSchema), async (req, res, next) => {
  try {
    const payload = req.body as CreateTaskInput;
    const task = await createTask(payload, req.user?.id);
    res.status(201).json(successResponse(task));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updateTaskSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const payload = req.body as UpdateTaskInput;
    const task = await updateTask(id, payload, req.user?.id);
    res.json(successResponse(task));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await deleteTask(id, req.user?.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
