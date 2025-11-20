import { Router } from 'express';
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
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate());

router.get('/', async (req, res, next) => {
  try {
    const parsed = opportunityFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(createError(422, 'Validation error', { details: parsed.error.flatten() }));
    }

    const result = await listOpportunities(parsed.data);
    res.json(successResponse(result.data, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const opportunity = await getOpportunityById(id);
    res.json(successResponse(opportunity));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createOpportunitySchema), async (req, res, next) => {
  try {
    const payload = req.body as CreateOpportunityInput;
    const opportunity = await createOpportunity(payload, req.user?.id);
    res.status(201).json(successResponse(opportunity));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updateOpportunitySchema), async (req, res, next) => {
  try {
    const payload = req.body as UpdateOpportunityInput;
    const { id } = req.params as { id: string };
    const opportunity = await updateOpportunity(id, payload, req.user?.id);
    res.json(successResponse(opportunity));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await softDeleteOpportunity(id, req.user?.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
