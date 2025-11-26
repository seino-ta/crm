import { cookies, headers } from 'next/headers';

import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config';

function parseAcceptLanguage(value?: string | null): Locale | null {
  if (!value) return null;
  const parts = value.split(',').map((entry) => entry.trim());
  for (const part of parts) {
    const [tag] = part.split(';');
    const base = tag?.split('-')[0];
    if (isLocale(tag)) return tag as Locale;
    if (isLocale(base)) return base as Locale;
  }
  return null;
}

export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const readCookieFromHeader = () => {
    const cookieHeader = headerList.get('cookie');
    if (!cookieHeader) return undefined;
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const [key, ...rest] = pair.split('=');
      if (key?.trim() === LOCALE_COOKIE) {
        return decodeURIComponent(rest.join('=').trim());
      }
    }
    return undefined;
  };

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value ?? readCookieFromHeader();
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  let acceptLanguage: string | null = null;
  try {
    acceptLanguage = headerList.get('accept-language');
  } catch {
    acceptLanguage = null;
  }
  const detected = parseAcceptLanguage(acceptLanguage);
  if (detected) {
    return detected;
  }

  return defaultLocale;
}
