import { ActivityType, AuditAction, OpportunityStatus, Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import createError from 'http-errors';

import prisma from '../../lib/prisma';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination';

import type {
  CreateOpportunityInput,
  OpportunityFilterQuery,
  UpdateOpportunityInput,
} from './opportunity.schema';

const DEFAULT_ORDER = { createdAt: 'desc' } as const;

async function ensureAccount(accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, deletedAt: null } });
  if (!account) throw createError(404, 'Account not found');
}

async function ensureOwner(ownerId: string) {
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) throw createError(404, 'Owner not found');
}

async function ensureStage(stageId: string) {
  const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
  if (!stage) throw createError(404, 'Pipeline stage not found');
  return stage;
}

async function ensureContact(contactId: string) {
  const contact = await prisma.contact.findFirst({ where: { id: contactId, deletedAt: null } });
  if (!contact) throw createError(404, 'Contact not found');
}

function inferStatusFromStage(
  statusInput: OpportunityStatus | undefined,
  stage: { isWon: boolean; isLost: boolean }
): OpportunityStatus {
  if (statusInput) return statusInput;
  if (stage.isWon) return OpportunityStatus.WON;
  if (stage.isLost) return OpportunityStatus.LOST;
  return OpportunityStatus.OPEN;
}

export async function listOpportunities(query: OpportunityFilterQuery) {
  const { search, status, stageId, ownerId, accountId, page, pageSize } = query;
  const { page: normalizedPage, pageSize: normalizedPageSize, skip, take } = normalizePagination({ page, pageSize });

  const where: Prisma.OpportunityWhereInput = {
    deletedAt: null,
  };

  if (status) where.status = status;
  if (stageId) where.stageId = stageId;
  if (ownerId) where.ownerId = ownerId;
  if (accountId) where.accountId = accountId;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [total, data] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.opportunity.findMany({
      where,
      orderBy: DEFAULT_ORDER,
      skip,
      take,
      include: {
        account: true,
        owner: true,
        stage: true,
        contact: true,
      },
    }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(total, normalizedPage, normalizedPageSize),
  };
}

export async function getOpportunityById(id: string) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id, deletedAt: null },
    include: { account: true, owner: true, stage: true, contact: true },
  });

  if (!opportunity) throw createError(404, 'Opportunity not found');
  return opportunity;
}

export async function createOpportunity(payload: CreateOpportunityInput) {
  await ensureAccount(payload.accountId);
  await ensureOwner(payload.ownerId);
  const stage = await ensureStage(payload.stageId);
  if (payload.contactId) await ensureContact(payload.contactId);

  const data: Prisma.OpportunityCreateInput = {
    name: payload.name,
    account: { connect: { id: payload.accountId } },
    owner: { connect: { id: payload.ownerId } },
    stage: { connect: { id: payload.stageId } },
    status: inferStatusFromStage(payload.status, stage),
  };

  if (payload.contactId) data.contact = { connect: { id: payload.contactId } };
  if (payload.amount !== undefined) data.amount = new Prisma.Decimal(payload.amount);
  if (payload.currency !== undefined) data.currency = payload.currency;
  if (payload.probability !== undefined) data.probability = payload.probability;
  else if (stage.probability !== null) data.probability = stage.probability;
  if (payload.expectedCloseDate !== undefined) data.expectedCloseDate = payload.expectedCloseDate;
  if (payload.description !== undefined) data.description = payload.description ?? null;
  if (payload.lostReason !== undefined) data.lostReason = payload.lostReason ?? null;

  const opportunity = await prisma.opportunity.create({
    data,
    include: { account: true, owner: true, stage: true, contact: true },
  });

  await recordAudit(opportunity.id, AuditAction.CREATE, { id: opportunity.id });

  return opportunity;
}

function serializeChanges(changes: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(changes)) as Prisma.InputJsonValue;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function recordAudit(opportunityId: string, action: AuditAction, changes: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      entityType: 'Opportunity',
      entityId: opportunityId,
      action,
      changes: serializeChanges(changes),
      opportunityId,
    },
  });
}

async function handleStageChangeAutomation(opportunity: Prisma.OpportunityGetPayload<{
  include: { account: true; owner: true; stage: true; contact: true };
}>) {
  await prisma.activity.create({
    data: {
      type: ActivityType.NOTE,
      subject: `Stage changed to ${opportunity.stage.name}`,
      description: `Opportunity ${opportunity.name} moved to ${opportunity.stage.name}.`,
      occurredAt: new Date(),
      user: { connect: { id: opportunity.ownerId } },
      account: { connect: { id: opportunity.accountId } },
      opportunity: { connect: { id: opportunity.id } },
      ...(opportunity.contactId ? { contact: { connect: { id: opportunity.contactId } } } : {}),
    },
  });

  await prisma.task.create({
    data: {
      title: `Follow up (${opportunity.stage.name})`,
      description: `Plan next steps for "${opportunity.name}" in stage ${opportunity.stage.name}.`,
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
      dueDate: addDays(new Date(), 3),
      owner: { connect: { id: opportunity.ownerId } },
      account: { connect: { id: opportunity.accountId } },
      opportunity: { connect: { id: opportunity.id } },
      ...(opportunity.contactId ? { contact: { connect: { id: opportunity.contactId } } } : {}),
    },
  });
}

export async function updateOpportunity(id: string, payload: UpdateOpportunityInput) {
  const existing = await prisma.opportunity.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw createError(404, 'Opportunity not found');

  if (payload.accountId && payload.accountId !== existing.accountId) await ensureAccount(payload.accountId);
  if (payload.ownerId && payload.ownerId !== existing.ownerId) await ensureOwner(payload.ownerId);
  let stage;
  if (payload.stageId && payload.stageId !== existing.stageId) {
    stage = await ensureStage(payload.stageId);
  }
  if (payload.contactId && payload.contactId !== existing.contactId) await ensureContact(payload.contactId);

  const data: Prisma.OpportunityUpdateInput = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.accountId !== undefined) data.account = { connect: { id: payload.accountId } };
  if (payload.ownerId !== undefined) data.owner = { connect: { id: payload.ownerId } };
  if (payload.stageId !== undefined) {
    data.stage = { connect: { id: payload.stageId } };
    if (stage && payload.status === undefined) {
      data.status = inferStatusFromStage(undefined, stage);
    }
  }
  if (payload.contactId !== undefined) {
    data.contact = payload.contactId ? { connect: { id: payload.contactId } } : { disconnect: true };
  }
  if (payload.amount !== undefined) data.amount = new Prisma.Decimal(payload.amount);
  if (payload.currency !== undefined) data.currency = payload.currency;
  if (payload.probability !== undefined) {
    data.probability = payload.probability;
  } else if (stage && stage.probability !== null) {
    data.probability = stage.probability;
  }
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.expectedCloseDate !== undefined) data.expectedCloseDate = payload.expectedCloseDate;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.lostReason !== undefined) data.lostReason = payload.lostReason;

  const updated = await prisma.opportunity.update({
    where: { id },
    data,
    include: { account: true, owner: true, stage: true, contact: true },
  });

  if (payload.stageId && payload.stageId !== existing.stageId) {
    await recordAudit(id, AuditAction.STAGE_CHANGE, { from: existing.stageId, to: payload.stageId });
    await handleStageChangeAutomation(updated);
  } else {
    await recordAudit(id, AuditAction.UPDATE, payload);
  }

  return updated;
}

export async function softDeleteOpportunity(id: string) {
  const existing = await prisma.opportunity.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw createError(404, 'Opportunity not found');

  await prisma.opportunity.update({ where: { id }, data: { deletedAt: new Date() } });
  await recordAudit(id, AuditAction.DELETE, {});
}
