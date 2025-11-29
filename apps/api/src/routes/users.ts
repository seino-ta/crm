import { Router } from 'express';
import { UserRole } from '@prisma/client';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { successResponse } from '../utils/response';
import { inviteUserSchema, updateUserSchema, updateUserStatusSchema, userFilterSchema, type InviteUserInput, type UpdateUserInput, type UpdateUserStatusInput } from '../modules/user/user.schema';
import { getUserById, inviteUser, listUsers, updateUser, updateUserStatus } from '../modules/user/user.service';

const router = Router();

router.use(authenticate([UserRole.ADMIN]));

router.get('/', async (req, res, next) => {
  try {
    const parsed = userFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }
    const result = await listUsers(parsed.data);
    res.json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const user = await getUserById(id);
    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(inviteUserSchema), async (req, res, next) => {
  try {
    const payload = req.body as InviteUserInput;
    const result = await inviteUser(payload, req.user?.id);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const payload = req.body as UpdateUserInput;
    const { id } = req.params as { id: string };
    const user = await updateUser(id, payload, req.user?.id);
    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', validateBody(updateUserStatusSchema), async (req, res, next) => {
  try {
    const payload = req.body as UpdateUserStatusInput;
    const { id } = req.params as { id: string };
    const user = await updateUserStatus(id, payload, req.user?.id);
    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
});

export default router;
