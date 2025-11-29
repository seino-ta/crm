'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { apiFetch } from '../api-client';

const roleEnum = z.enum(['ADMIN', 'MANAGER', 'REP']);

const inviteSchema = z.object({
  email: z.string().email(),
  firstName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : undefined)),
  lastName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : undefined)),
  title: z
    .string()
    .max(150)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : undefined)),
  phone: z
    .string()
    .max(50)
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : undefined)),
  role: roleEnum,
});

const updateSchema = inviteSchema.partial().extend({
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

export type InviteUserActionState = {
  ok?: boolean;
  password?: string;
  error?: 'validation' | 'requestFailed';
};

export async function inviteUserAction(_state: InviteUserActionState | undefined, formData: FormData): Promise<InviteUserActionState> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: 'validation' };
  }

  try {
    const { data } = await apiFetch<{ user: unknown; temporaryPassword: string }>(`/users`, {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/admin/users');
    revalidatePath('/admin/audit-logs');
    return { ok: true, password: data.temporaryPassword };
  } catch (error) {
    console.error(error);
    return { error: 'requestFailed' };
  }
}

export async function updateUserAction(userId: string, formData: FormData) {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return;
  }
  try {
    await apiFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(parsed.data),
    });
    revalidatePath('/admin/users');
    revalidatePath('/admin/audit-logs');
  } catch (error) {
    console.error(error);
  }
}

export async function toggleUserStatusAction(userId: string, nextStatus: boolean, _formData: FormData) {
  try {
    await apiFetch(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: nextStatus }),
    });
    revalidatePath('/admin/users');
    revalidatePath('/admin/audit-logs');
  } catch (error) {
    console.error(error);
  }
}
