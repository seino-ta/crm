'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { apiFetch } from '../api-client';
import { DASHBOARD_PATH, LOGIN_PATH, TOKEN_COOKIE } from '../constants';

async function getCookieStore() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type AuthFormState = {
  error?: string;
};

export async function loginAction(_prevState: AuthFormState | undefined, formData: FormData): Promise<AuthFormState | void> {
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return { error: 'メールアドレスとパスワードを確認してください。' };
  }

  try {
    const { data } = await apiFetch<{ token: string; user: { id: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(result.data),
      skipAuth: true,
    });

    const cookieStore = await getCookieStore();
    cookieStore?.set?.(TOKEN_COOKIE, data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12, // 12h
    });

    redirect(DASHBOARD_PATH);
  } catch (error) {
    console.error(error);
    return { error: 'ログインに失敗しました。資格情報を確認してください。' };
  }
}

export async function logoutAction() {
  const cookieStore = await getCookieStore();
  cookieStore?.delete?.(TOKEN_COOKIE);
  redirect(LOGIN_PATH);
}
