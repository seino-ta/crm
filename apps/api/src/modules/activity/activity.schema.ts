import { ActivityType } from '@prisma/client';
import { z } from 'zod';

const id = () => z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid ID format');

export const activityFilterSchema = z.object({
  search: z.string().trim().min(1).max(255).optional(),
  type: z.nativeEnum(ActivityType).optional(),
  userId: id().optional(),
  accountId: id().optional(),
  contactId: id().optional(),
  opportunityId: id().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  subject: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  userId: id(),
  accountId: id().optional(),
  contactId: id().optional(),
  opportunityId: id().optional(),
  occurredAt: z.coerce.date().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
