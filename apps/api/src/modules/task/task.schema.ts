import { TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

const id = () => z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid ID format');

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  ownerId: id().optional(),
  accountId: id().optional(),
  opportunityId: id().optional(),
  activityId: id().optional(),
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
  ownerId: id(),
  activityId: id().optional(),
  accountId: id().optional(),
  opportunityId: id().optional(),
  contactId: id().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
