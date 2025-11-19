import { AccountStatus } from '@prisma/client';
import { z } from 'zod';

export const accountFilterSchema = z.object({
  search: z.string().min(1).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createAccountSchema = z.object({
  name: z.string().min(2).max(255),
  domain: z.string().url().optional(),
  industry: z.string().max(255).optional(),
  website: z.string().url().optional(),
  size: z.number().int().positive().optional(),
  description: z.string().max(2000).optional(),
  annualRevenue: z.number().nonnegative().optional(),
  phone: z.string().max(50).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type AccountListQuery = z.infer<typeof accountFilterSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
