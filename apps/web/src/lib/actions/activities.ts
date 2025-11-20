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

export async function deleteActivityAction(activityId: string) {
  await apiFetch(`/activities/${activityId}`, { method: 'DELETE' });
  revalidatePath('/activities');
  revalidatePath('/tasks');
}
