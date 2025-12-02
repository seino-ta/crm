import { LeadStatus } from '@prisma/client';
import { z } from 'zod';

export const leadStatusEnum = z.nativeEnum(LeadStatus);

export const leadFilterSchema = z.object({
  search: z.string().optional(),
  status: leadStatusEnum.optional(),
  ownerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type LeadListQuery = z.infer<typeof leadFilterSchema>;

const optionalString = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((val) => (val ? val : undefined));

export const createLeadSchema = z.object({
  name: z.string().min(2),
  company: optionalString,
  email: optionalString,
  phone: optionalString,
  ownerId: z.string().uuid(),
  status: leadStatusEnum.optional(),
  source: optionalString,
  notes: optionalString,
  accountId: z.string().uuid().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

export const updateLeadSchema = createLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
