import { AuditAction } from '@prisma/client';
import { z } from 'zod';

const uuid = () => z.string().uuid();

export const auditLogFilterSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: uuid().optional(),
  opportunityId: uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>;
