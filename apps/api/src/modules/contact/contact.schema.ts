import { z } from 'zod';

export const contactFilterSchema = z.object({
  search: z.string().min(1).optional(),
  accountId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createContactSchema = z.object({
  accountId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  kanaFirstName: z.string().max(100).optional(),
  kanaLastName: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(150).optional(),
  linkedin: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  accountId: z.string().uuid().optional(),
});

export type ContactListQuery = z.infer<typeof contactFilterSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
