import { z } from 'zod';

export const createPipelineStageSchema = z.object({
  name: z.string().min(2).max(255),
  order: z.number().int().min(0),
  probability: z.number().int().min(0).max(100).optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
  description: z.string().max(1000).optional(),
});

export const updatePipelineStageSchema = createPipelineStageSchema.partial();

export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>;
