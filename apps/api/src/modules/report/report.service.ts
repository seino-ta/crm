import prisma from '../../lib/prisma';

export async function stageSummaryReport() {
  return prisma.opportunity.groupBy({
    by: ['stageId'],
    _sum: { amount: true },
    _count: { _all: true },
    where: { deletedAt: null },
  });
}

export async function ownerPipelineReport() {
  return prisma.opportunity.groupBy({
    by: ['ownerId'],
    _sum: { amount: true },
    _count: { _all: true },
    where: { deletedAt: null },
  });
}
