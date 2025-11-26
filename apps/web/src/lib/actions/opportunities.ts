'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { apiFetch } from '../api-client';

const uuid = () =>
  z
    .string()
    .uuid()
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : undefined));

const opportunitySchema = z.object({
  name: z.string().min(2),
  accountId: z.string().uuid(),
  ownerId: z.string().uuid(),
  stageId: z.string().uuid(),
  contactId: uuid(),
  amount: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().nonnegative().optional())
    .optional(),
  currency: z.string().min(3).max(10).default('JPY'),
  probability: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().min(0).max(100).optional())
    .optional(),
  status: z.string().optional(),
  expectedCloseDate: z
    .preprocess((val) => {
      if (val === '' || val === null) return undefined;
      if (typeof val === 'string') {
        const date = new Date(val);
        if (!Number.isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return val;
    }, z.string().datetime({ offset: true }).optional())
    .optional(),
  description: z.string().max(4000).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

export type OpportunityActionState = {
  ok?: boolean;
  error?: 'validation' | 'createFailed';
};

export type OpportunityStageActionState = {
  ok?: boolean;
  error?: 'stageLoadFailed' | 'stageMissing' | 'stageUpdateFailed';
};

export async function createOpportunityAction(_state: OpportunityActionState | undefined, formData: FormData): Promise<OpportunityActionState> {
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: 'validation' };
  }
  try {
    await apiFetch('/opportunities', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/opportunities');
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'createFailed' };
  }
}

export async function updateOpportunityStageAction(
  opportunityId: string,
  _prevState: OpportunityStageActionState | undefined,
  formData: FormData
) : Promise<OpportunityStageActionState> {
  if (!formData || typeof formData.get !== 'function') {
    return { error: 'stageLoadFailed' };
  }

  const stageId = formData.get('stageId');
  if (!stageId || typeof stageId !== 'string') {
    return { error: 'stageMissing' };
  }
  try {
    await apiFetch(`/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify({ stageId }),
    });
    revalidatePath('/opportunities');
    revalidatePath(`/opportunities/${opportunityId}`);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'stageUpdateFailed' };
  }
}
