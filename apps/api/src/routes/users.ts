import { UserRole } from '@prisma/client';
import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  inviteUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userFilterSchema,
  type InviteUserInput,
  type UpdateUserInput,
  type UpdateUserStatusInput,
} from '../modules/user/user.schema';
import { getUserById, inviteUser, listUsers, updateUser, updateUserStatus } from '../modules/user/user.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.get('/', authenticate([UserRole.ADMIN, UserRole.MANAGER]), async (c) => {
  const parsed = userFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }
  const result = await listUsers(parsed.data);
  return c.json(successResponse(result.data, result.meta));
});

router.get('/:id', authenticate([UserRole.ADMIN, UserRole.MANAGER]), async (c) => {
  const { id } = c.req.param();
  const user = await getUserById(id);
  return c.json(successResponse(user));
});

router.post('/', authenticate([UserRole.ADMIN]), validateBody(inviteUserSchema), async (c) => {
  const payload = getValidatedBody<InviteUserInput>(c);
  const result = await inviteUser(payload, requireUser(c).id);
  return c.json(successResponse(result), 201);
});

router.put('/:id', authenticate([UserRole.ADMIN]), validateBody(updateUserSchema), async (c) => {
  const payload = getValidatedBody<UpdateUserInput>(c);
  const { id } = c.req.param();
  const user = await updateUser(id, payload, requireUser(c).id);
  return c.json(successResponse(user));
});

router.patch('/:id/status', authenticate([UserRole.ADMIN]), validateBody(updateUserStatusSchema), async (c) => {
  const payload = getValidatedBody<UpdateUserStatusInput>(c);
  const { id } = c.req.param();
  const user = await updateUserStatus(id, payload, requireUser(c).id);
  return c.json(successResponse(user));
});

export default router;
