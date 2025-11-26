'use server';

import { cookies } from 'next/headers';

import { LOCALE_COOKIE, defaultLocale, isLocale } from '@/lib/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocaleAction(locale: string) {
  const nextLocale = isLocale(locale) ? locale : defaultLocale;
  const cookieStore = cookies();
  cookieStore.set(LOCALE_COOKIE, nextLocale, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });
}
