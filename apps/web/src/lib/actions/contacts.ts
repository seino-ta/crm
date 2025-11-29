'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { apiFetch } from '../api-client';

export type ContactActionState = {
  ok?: boolean;
  error?: 'validation' | 'createFailed' | 'updateFailed';
};

export type ContactDeleteState = {
  ok?: boolean;
  error?: 'deleteFailed';
};

const contactSchema = z.object({
  accountId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  kanaFirstName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : undefined)),
  kanaLastName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : undefined)),
  email: z.string().email(),
  phone: z.string().max(50).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  jobTitle: z.string().max(150).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
  notes: z.string().max(2000).optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

export async function createContactAction(_state: ContactActionState | undefined, formData: FormData): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: 'validation' };
  }

  try {
    await apiFetch('/contacts', { method: 'POST', body: JSON.stringify(parsed.data) });
    revalidatePath('/contacts');
    revalidatePath('/opportunities');
    revalidatePath(`/accounts/${parsed.data.accountId}`);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'createFailed' };
  }
}

export async function updateContactAction(
  contactId: string,
  previousAccountId: string | null,
  _state: ContactActionState | undefined,
  formData: FormData
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: 'validation' };
  }

  try {
    await apiFetch(`/contacts/${contactId}`, { method: 'PUT', body: JSON.stringify(parsed.data) });
    revalidatePath('/contacts');
    revalidatePath('/opportunities');
    if (previousAccountId) {
      revalidatePath(`/accounts/${previousAccountId}`);
    }
    if (!previousAccountId || previousAccountId !== parsed.data.accountId) {
      revalidatePath(`/accounts/${parsed.data.accountId}`);
    }
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'updateFailed' };
  }
}

export async function deleteContactAction(contactId: string, accountId?: string | null): Promise<ContactDeleteState> {
  try {
    await apiFetch(`/contacts/${contactId}`, { method: 'DELETE' });
    revalidatePath('/contacts');
    revalidatePath('/opportunities');
    if (accountId) {
      revalidatePath(`/accounts/${accountId}`);
    }
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'deleteFailed' };
  }
}
