'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { apiFetch } from '../api-client';

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  ownerId: z.string().uuid(),
  priority: z.string().optional(),
  dueDate: z
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
  accountId: z.string().uuid().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  opportunityId: z.string().uuid().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

export async function createTaskAction(_state: { error?: string } | undefined, formData: FormData) {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: '入力内容を確認してください。' };
  }
  try {
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/tasks');
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'タスクの作成に失敗しました。' };
  }
}

export async function toggleTaskStatusAction(taskId: string, currentStatus: string) {
  const nextStatus = currentStatus === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
  await apiFetch(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: nextStatus }),
  });
  revalidatePath('/tasks');
}

export async function deleteTaskAction(taskId: string) {
  await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
  revalidatePath('/tasks');
  revalidatePath('/activities');
}
