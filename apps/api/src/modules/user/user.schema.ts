import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const userFilterSchema = z.object({
  search: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  title: z.string().max(150).optional(),
  phone: z.string().max(50).optional(),
  role: z.nativeEnum(UserRole),
});

export const updateUserSchema = inviteUserSchema.partial().extend({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UserFilterQuery = z.infer<typeof userFilterSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
