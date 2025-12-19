import { Hono } from 'hono';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '../modules/auth/auth.schema';
import { getCurrentUser, loginUser, signupUser } from '../modules/auth/auth.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.post('/signup', validateBody(signupSchema), async (c) => {
  const body = getValidatedBody<SignupInput>(c);
  const result = await signupUser(body);
  return c.json(successResponse(result), 201);
});

router.post('/login', validateBody(loginSchema), async (c) => {
  const body = getValidatedBody<LoginInput>(c);
  const result = await loginUser(body);
  return c.json(successResponse(result));
});

router.get('/me', authenticate(), async (c) => {
  const user = await getCurrentUser(requireUser(c).id);
  return c.json(successResponse({ user }));
});

export default router;
