import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '../modules/auth/auth.schema';
import { loginUser, signupUser, getCurrentUser } from '../modules/auth/auth.service';
import { successResponse } from '../utils/response';

const router = Router();

router.post('/signup', validateBody(signupSchema), async (req, res, next) => {
  try {
    const body = req.body as SignupInput;
    const result = await signupUser(body);
    res.status(201).json(successResponse(result));
  } catch (error) {
    next(error);
  }
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const body = req.body as LoginInput;
    const result = await loginUser(body);
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate(), async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(successResponse({ user: null }));
    }

    const user = await getCurrentUser(req.user.id);
    res.json(successResponse({ user }));
  } catch (error) {
    next(error);
  }
});

export default router;
