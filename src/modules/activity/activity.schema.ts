import { ActivityType } from '@prisma/client';
import { z } from 'zod';

const uuid = () => z.string().uuid();

export const activityFilterSchema = z.object({
  type: z.nativeEnum(ActivityType).optional(),
  userId: uuid().optional(),
  accountId: uuid().optional(),
  contactId: uuid().optional(),
  opportunityId: uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  subject: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  userId: uuid(),
  accountId: uuid().optional(),
  contactId: uuid().optional(),
  opportunityId: uuid().optional(),
  occurredAt: z.coerce.date().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
