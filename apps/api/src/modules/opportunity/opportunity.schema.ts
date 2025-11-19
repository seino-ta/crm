import { OpportunityStatus } from '@prisma/client';
import { z } from 'zod';

const uuid = () => z.string().uuid();

const baseOpportunitySchema = z.object({
  name: z.string().min(2).max(255),
  accountId: uuid(),
  ownerId: uuid(),
  stageId: uuid(),
  contactId: uuid().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(10).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  status: z.nativeEnum(OpportunityStatus).optional(),
  expectedCloseDate: z.coerce.date().optional(),
  description: z.string().max(5000).optional(),
  lostReason: z.string().max(2000).optional(),
});

export const createOpportunitySchema = baseOpportunitySchema;

export const updateOpportunitySchema = baseOpportunitySchema.partial();

export const opportunityFilterSchema = z.object({
  search: z.string().min(1).optional(),
  status: z.nativeEnum(OpportunityStatus).optional(),
  stageId: uuid().optional(),
  ownerId: uuid().optional(),
  accountId: uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export type OpportunityFilterQuery = z.infer<typeof opportunityFilterSchema>;
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
