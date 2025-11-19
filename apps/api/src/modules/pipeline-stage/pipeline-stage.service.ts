import type { Prisma } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';

import type { CreatePipelineStageInput, UpdatePipelineStageInput } from './pipeline-stage.schema';

export async function listPipelineStages() {
  return prisma.pipelineStage.findMany({ orderBy: { order: 'asc' } });
}

export async function getPipelineStageById(id: string) {
  const stage = await prisma.pipelineStage.findUnique({ where: { id } });
  if (!stage) {
    throw createError(404, 'Pipeline stage not found');
  }
  return stage;
}

export async function createPipelineStage(payload: CreatePipelineStageInput) {
  return prisma.pipelineStage.create({
    data: {
      name: payload.name,
      order: payload.order,
      probability: payload.probability ?? 0,
      isWon: payload.isWon ?? false,
      isLost: payload.isLost ?? false,
      description: payload.description ?? null,
    },
  });
}

export async function updatePipelineStage(id: string, payload: UpdatePipelineStageInput) {
  await getPipelineStageById(id);

  const data: Prisma.PipelineStageUpdateInput = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.order !== undefined) data.order = payload.order;
  if (payload.probability !== undefined) data.probability = payload.probability;
  if (payload.isWon !== undefined) data.isWon = payload.isWon;
  if (payload.isLost !== undefined) data.isLost = payload.isLost;
  if (payload.description !== undefined) data.description = payload.description ?? null;

  return prisma.pipelineStage.update({
    where: { id },
    data,
  });
}

export async function deletePipelineStage(id: string) {
  await getPipelineStageById(id);

  try {
    await prisma.pipelineStage.delete({ where: { id } });
  } catch (error) {
    void error;
    throw createError(409, 'Unable to delete pipeline stage with existing opportunities');
  }
}
