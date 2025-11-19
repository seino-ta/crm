'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { apiFetch } from '../api-client';

const activitySchema = z.object({
  type: z.string(),
  subject: z.string().min(2),
  description: z.string().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  userId: z.string().uuid(),
  accountId: z.string().uuid().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  opportunityId: z.string().uuid().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  occurredAt: z
    .preprocess((val) => (val === '' || val === null ? undefined : val), z.string().datetime({ offset: false }).optional())
    .optional(),
});

export async function createActivityAction(_state: { error?: string } | undefined, formData: FormData) {
  const parsed = activitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: '入力内容を確認してください。' };
  }
  try {
    await apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/activities');
    revalidatePath('/tasks');
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: '活動の記録に失敗しました。' };
  }
}
