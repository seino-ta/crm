'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
  currency: z.string().min(3).max(10).default('USD'),
  probability: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().min(0).max(100).optional())
    .optional(),
  status: z.string().optional(),
  expectedCloseDate: z
    .preprocess((val) => (val === '' || val === null ? undefined : val), z.string().datetime({ offset: false }).optional())
    .optional(),
  description: z.string().max(4000).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

export async function createOpportunityAction(_state: { error?: string } | undefined, formData: FormData) {
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: '入力内容を確認してください。' };
  }
  try {
    await apiFetch('/opportunities', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/opportunities');
    redirect('/opportunities');
  } catch (error) {
    console.error(error);
    return { error: '案件の作成に失敗しました。' };
  }
}

export async function updateOpportunityStageAction(opportunityId: string, formData: FormData) {
  const stageId = formData.get('stageId');
  try {
    await apiFetch(`/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify({ stageId }),
    });
    revalidatePath('/opportunities');
    revalidatePath(`/opportunities/${opportunityId}`);
  } catch (error) {
    console.error(error);
    return { error: 'ステージ更新に失敗しました。' };
  }
}
