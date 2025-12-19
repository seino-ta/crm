import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createOpportunitySchema,
  opportunityFilterSchema,
  updateOpportunitySchema,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from '../modules/opportunity/opportunity.schema';
import {
  createOpportunity,
  getOpportunityById,
  listOpportunities,
  softDeleteOpportunity,
  updateOpportunity,
} from '../modules/opportunity/opportunity.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/', async (c) => {
  const parsed = opportunityFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }

  const result = await listOpportunities(parsed.data);
  return c.json(successResponse(result.data, result.meta));
});

router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const opportunity = await getOpportunityById(id);
  return c.json(successResponse(opportunity));
});

router.post('/', validateBody(createOpportunitySchema), async (c) => {
  const payload = getValidatedBody<CreateOpportunityInput>(c);
  const opportunity = await createOpportunity(payload, requireUser(c));
  return c.json(successResponse(opportunity), 201);
});

router.put('/:id', validateBody(updateOpportunitySchema), async (c) => {
  const payload = getValidatedBody<UpdateOpportunityInput>(c);
  const { id } = c.req.param();
  const opportunity = await updateOpportunity(id, payload, requireUser(c));
  return c.json(successResponse(opportunity));
});

router.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await softDeleteOpportunity(id, requireUser(c));
  return c.body(null, 204);
});

export default router;
