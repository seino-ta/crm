'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { apiFetch } from '../api-client';

export type LeadActionState = {
  ok?: boolean;
  error?: 'validation' | 'createFailed';
};

const optionalString = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((val) => (val ? val : undefined));

const leadSchema = z.object({
  name: z.string().min(2),
  company: optionalString,
  email: optionalString,
  phone: optionalString,
  status: z.string().optional(),
  ownerId: z.string().uuid(),
  source: optionalString,
  notes: optionalString,
  accountId: z.string().uuid().optional().or(z.literal('')).transform((val) => (val ? val : undefined)),
});

export async function createLeadAction(_state: LeadActionState | undefined, formData: FormData): Promise<LeadActionState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: 'validation' };
  }

  try {
    await apiFetch('/leads', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/leads');
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { error: 'createFailed' };
  }
}

export async function updateLeadStatusAction(leadId: string, status: string) {
  await apiFetch(`/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  revalidatePath('/leads');
}

export async function deleteLeadAction(leadId: string) {
  await apiFetch(`/leads/${leadId}`, { method: 'DELETE' });
  revalidatePath('/leads');
}
