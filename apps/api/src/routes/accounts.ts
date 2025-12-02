import { Router } from 'express';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { accountFilterSchema, createAccountSchema, updateAccountSchema, type CreateAccountInput, type UpdateAccountInput } from '../modules/account/account.schema';
import { createAccount, getAccountById, listAccounts, restoreAccount, softDeleteAccount, updateAccount } from '../modules/account/account.service';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate());

router.get('/', async (req, res, next) => {
  try {
    const parsed = accountFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }
    const result = await listAccounts(parsed.data);
    res.json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const account = await getAccountById(id, { includeDeleted: true });
    res.json(successResponse(account));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createAccountSchema), async (req, res, next) => {
  try {
    const payload = req.body as CreateAccountInput;
    const account = await createAccount(payload, req.user);
    res.status(201).json(successResponse(account));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updateAccountSchema), async (req, res, next) => {
  try {
    const payload = req.body as UpdateAccountInput;
    const { id } = req.params as { id: string };
    const account = await updateAccount(id, payload, req.user?.id);
    res.json(successResponse(account));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await softDeleteAccount(id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/restore', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const account = await restoreAccount(id, req.user);
    res.json(successResponse(account));
  } catch (error) {
    next(error);
  }
});

export default router;
