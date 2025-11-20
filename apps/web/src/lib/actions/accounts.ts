'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { apiFetch } from '../api-client';

const baseAccountSchema = z.object({
  name: z.string().min(2),
  domain: z.string().url().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  industry: z.string().max(255).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  website: z.string().url().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  size: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().int().positive().optional())
    .optional(),
  description: z.string().max(2000).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  annualRevenue: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().nonnegative().optional())
    .optional(),
  phone: z.string().max(50).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  status: z.string().optional(),
});

const createAccountSchema = baseAccountSchema;
const updateAccountSchema = baseAccountSchema.partial();

export async function createAccountAction(_state: { error?: string } | undefined, formData: FormData) {
  const parsed = createAccountSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: '入力内容を確認してください。' };
  }

  try {
    await apiFetch('/accounts', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/accounts');
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'アカウントの作成に失敗しました。' };
  }
}

export async function updateAccountAction(accountId: string, _state: { error?: string } | undefined, formData: FormData) {
  const parsed = updateAccountSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: '入力内容を確認してください。' };
  }
  try {
    await apiFetch(`/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/accounts');
    revalidatePath(`/accounts/${accountId}`);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'アカウントの更新に失敗しました。' };
  }
}

export async function deleteAccountAction(accountId: string) {
  await apiFetch(`/accounts/${accountId}`, { method: 'DELETE' });
  revalidatePath('/accounts');
  redirect('/accounts');
}
