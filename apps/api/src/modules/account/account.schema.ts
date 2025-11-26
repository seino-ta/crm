import { AccountStatus } from '@prisma/client';
import { z } from 'zod';

const booleanQuery = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'));

export const accountFilterSchema = z.object({
  search: z.string().min(1).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  archived: booleanQuery.optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

const optionalText = z.string().max(255).optional();

export const createAccountSchema = z.object({
  name: z.string().min(2).max(255),
  domain: optionalText,
  industry: optionalText,
  website: optionalText,
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
