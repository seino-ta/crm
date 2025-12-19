import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  accountFilterSchema,
  createAccountSchema,
  updateAccountSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '../modules/account/account.schema';
import {
  createAccount,
  getAccountById,
  listAccounts,
  restoreAccount,
  softDeleteAccount,
  updateAccount,
} from '../modules/account/account.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/', async (c) => {
  const parsed = accountFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }
  const result = await listAccounts(parsed.data);
  return c.json(successResponse(result.data, result.meta));
});

router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const account = await getAccountById(id, { includeDeleted: true });
  return c.json(successResponse(account));
});

router.post('/', validateBody(createAccountSchema), async (c) => {
  const payload = getValidatedBody<CreateAccountInput>(c);
  const account = await createAccount(payload, requireUser(c));
  return c.json(successResponse(account), 201);
});

router.put('/:id', validateBody(updateAccountSchema), async (c) => {
  const payload = getValidatedBody<UpdateAccountInput>(c);
  const { id } = c.req.param();
  const user = requireUser(c);
  const account = await updateAccount(id, payload, user.id);
  return c.json(successResponse(account));
});

router.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await softDeleteAccount(id, requireUser(c));
  return c.body(null, 204);
});

router.post('/:id/restore', async (c) => {
  const { id } = c.req.param();
  const account = await restoreAccount(id, requireUser(c));
  return c.json(successResponse(account));
});

export default router;
