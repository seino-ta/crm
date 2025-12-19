import { Hono } from 'hono';
import createError from 'http-errors';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createLeadSchema,
  leadFilterSchema,
  updateLeadSchema,
  type CreateLeadInput,
  type UpdateLeadInput,
} from '../modules/lead/lead.schema';
import { createLead, getLeadById, listLeads, softDeleteLead, updateLead } from '../modules/lead/lead.service';
import type { AppEnv } from '../types/runtime';
import { getValidatedBody, requireUser } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/', async (c) => {
  const parsed = leadFilterSchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw createError(422, 'Validation error', { details: parsed.error.flatten() });
  }

  const result = await listLeads(parsed.data);
  return c.json(successResponse(result.data, result.meta));
});

router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const lead = await getLeadById(id);
  return c.json(successResponse(lead));
});

router.post('/', validateBody(createLeadSchema), async (c) => {
  const payload = getValidatedBody<CreateLeadInput>(c);
  const lead = await createLead(payload, requireUser(c));
  return c.json(successResponse(lead), 201);
});

router.put('/:id', validateBody(updateLeadSchema), async (c) => {
  const { id } = c.req.param();
  const payload = getValidatedBody<UpdateLeadInput>(c);
  const lead = await updateLead(id, payload, requireUser(c));
  return c.json(successResponse(lead));
});

router.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await softDeleteLead(id, requireUser(c));
  return c.body(null, 204);
});

export default router;
