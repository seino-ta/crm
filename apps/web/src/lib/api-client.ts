import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { API_BASE_URL } from './env';
import { LOGIN_PATH, TOKEN_COOKIE } from './constants';
import type { ApiMeta } from './types';

type SuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

type ErrorEnvelope = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type FetchOptions = RequestInit & {
  skipAuth?: boolean;
  parse?: boolean;
};

async function getCookieStore() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

async function readToken() {
  const cookieStore = await getCookieStore();
  const getter = cookieStore && typeof cookieStore.get === 'function' ? cookieStore.get.bind(cookieStore) : null;
  if (!getter) return undefined;
  return getter(TOKEN_COOKIE)?.value;
}

async function handleUnauthorized() {
  redirect(LOGIN_PATH);
}

export async function apiFetch<T>(path: string, init: FetchOptions = {}): Promise<{ data: T; meta?: ApiMeta }> {
  const token = init.skipAuth ? undefined : await readToken();

  if (!init.skipAuth && !token) {
    await handleUnauthorized();
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (!init.skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (response.status === 204) {
    return { data: undefined as T };
  }

  let payload: SuccessEnvelope<T> | ErrorEnvelope | null = null;
  try {
    payload = (await response.json()) as SuccessEnvelope<T> | ErrorEnvelope;
  } catch {
    throw new ApiError('無効な API レスポンスです', response.status);
  }

  if (!response.ok) {
    if (response.status === 401 && !init.skipAuth) {
      await handleUnauthorized();
    }
    const message = !payload || 'error' in payload === false ? 'リクエストに失敗しました' : payload.error.message;
    throw new ApiError(message, response.status, 'error' in (payload ?? {}) ? payload.error.details : undefined);
  }

  if (!payload?.success) {
    throw new ApiError('API フォーマットが不正です', response.status);
  }

  return { data: payload.data, meta: payload.meta };
}
