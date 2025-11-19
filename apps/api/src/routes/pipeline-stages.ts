import { Router } from 'express';

import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createPipelineStageSchema,
  updatePipelineStageSchema,
  type CreatePipelineStageInput,
  type UpdatePipelineStageInput,
} from '../modules/pipeline-stage/pipeline-stage.schema';
import {
  createPipelineStage,
  deletePipelineStage,
  getPipelineStageById,
  listPipelineStages,
  updatePipelineStage,
} from '../modules/pipeline-stage/pipeline-stage.service';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate());

router.get('/', async (_req, res, next) => {
  try {
    const stages = await listPipelineStages();
    res.json(successResponse(stages));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const stage = await getPipelineStageById(id);
    res.json(successResponse(stage));
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createPipelineStageSchema), async (req, res, next) => {
  try {
    const payload = req.body as CreatePipelineStageInput;
    const stage = await createPipelineStage(payload);
    res.status(201).json(successResponse(stage));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBody(updatePipelineStageSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const payload = req.body as UpdatePipelineStageInput;
    const stage = await updatePipelineStage(id, payload);
    res.json(successResponse(stage));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    await deletePipelineStage(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
