import { NextResponse } from 'next/server';

import { LOCALE_COOKIE, defaultLocale, isLocale } from '@/lib/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  let locale: string | null = null;
  try {
    const body = await request.json();
    locale = body?.locale;
  } catch {
    const { searchParams } = new URL(request.url);
    locale = searchParams.get('locale');
  }
  const nextLocale = isLocale(locale) ? locale : defaultLocale;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE, nextLocale, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });
  return response;
}
