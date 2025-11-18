import { TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

const uuid = () => z.string().uuid();

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  ownerId: uuid().optional(),
  accountId: uuid().optional(),
  opportunityId: uuid().optional(),
  activityId: uuid().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional(),
  ownerId: uuid(),
  activityId: uuid().optional(),
  accountId: uuid().optional(),
  opportunityId: uuid().optional(),
  contactId: uuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
