import { Router } from 'express';
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
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate());

router.get('/', async (req, res, next) => {
  try {
    const parsed = leadFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }

    const result = await listLeads(parsed.data);
    res.json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const lead = await getLeadById(id);
    res.json(successResponse(lead));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createLeadSchema), async (req, res, next) => {
  try {
    const payload = req.body as CreateLeadInput;
    const lead = await createLead(payload, req.user);
    res.status(201).json(successResponse(lead));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updateLeadSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const payload = req.body as UpdateLeadInput;
    const lead = await updateLead(id, payload, req.user);
    res.json(successResponse(lead));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await softDeleteLead(id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
