import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { apiFetch } from './api-client';
import { LOGIN_PATH, TOKEN_COOKIE } from './constants';
import type { User } from './types';

export const getCurrentUser = cache(async () => {
  const { data } = await apiFetch<{ user: User | null }>('/auth/me');
  if (!data.user) {
    redirect(LOGIN_PATH);
  }
  return data.user;
});

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore?.delete?.(TOKEN_COOKIE);
}
