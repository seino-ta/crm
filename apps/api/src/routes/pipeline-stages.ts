import { Hono } from 'hono';

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
import type { AppEnv } from '../types/runtime';
import { getValidatedBody } from '../utils/context';
import { successResponse } from '../utils/response';

const router = new Hono<AppEnv>();

router.use('*', authenticate());

router.get('/', async (c) => {
  const stages = await listPipelineStages();
  return c.json(successResponse(stages));
});

router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const stage = await getPipelineStageById(id);
  return c.json(successResponse(stage));
});

router.post('/', validateBody(createPipelineStageSchema), async (c) => {
  const payload = getValidatedBody<CreatePipelineStageInput>(c);
  const stage = await createPipelineStage(payload);
  return c.json(successResponse(stage), 201);
});

router.put('/:id', validateBody(updatePipelineStageSchema), async (c) => {
  const payload = getValidatedBody<UpdatePipelineStageInput>(c);
  const { id } = c.req.param();
  const stage = await updatePipelineStage(id, payload);
  return c.json(successResponse(stage));
});

router.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await deletePipelineStage(id);
  return c.body(null, 204);
});

export default router;
