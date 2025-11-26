'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { ApiError, apiFetch } from '../api-client';

const optionalText = (max = 255) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val) return undefined;
      const trimmed = val.trim();
      return trimmed.length ? trimmed : undefined;
    });

const baseAccountSchema = z.object({
  name: z.string().min(2),
  domain: optionalText(),
  industry: optionalText(),
  website: optionalText(),
  size: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().int().positive().optional())
    .optional(),
  description: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val) return undefined;
      const trimmed = val.trim();
      return trimmed.length ? trimmed : undefined;
    }),
  annualRevenue: z
    .preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().nonnegative().optional())
    .optional(),
  phone: optionalText(50),
  status: z.string().optional(),
});

const createAccountSchema = baseAccountSchema;
const updateAccountSchema = baseAccountSchema.partial();

export type AccountActionState = {
  ok?: boolean;
  error?: 'validation' | 'createFailed' | 'updateFailed';
};

export type AccountRestoreState = {
  ok?: boolean;
  error?: 'restoreFailed';
};

function logApiError(error: unknown) {
  if (error instanceof ApiError) {
    console.error(error.message);
  } else {
    console.error(error);
  }
}

export async function createAccountAction(_state: AccountActionState | undefined, formData: FormData): Promise<AccountActionState> {
  const parsed = createAccountSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: 'validation' };
  }

  try {
    await apiFetch('/accounts', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/accounts');
    return { ok: true };
  } catch (error) {
    logApiError(error);
    return { error: 'createFailed' };
  }
}

export async function updateAccountAction(accountId: string, _state: AccountActionState | undefined, formData: FormData): Promise<AccountActionState> {
  const parsed = updateAccountSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: 'validation' };
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
    logApiError(error);
    return { error: 'updateFailed' };
  }
}

export async function deleteAccountAction(accountId: string) {
  await apiFetch(`/accounts/${accountId}`, { method: 'DELETE' });
  revalidatePath('/accounts');
  return { ok: true } as const;
}

export async function restoreAccountAction(accountId: string): Promise<AccountRestoreState> {
  try {
    await apiFetch(`/accounts/${accountId}/restore`, { method: 'POST' });
    revalidatePath('/accounts');
    revalidatePath(`/accounts/${accountId}`);
    return { ok: true };
  } catch (error) {
    logApiError(error);
    return { error: 'restoreFailed' };
  }
}
