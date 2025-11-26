'use client';

import { useTransition } from 'react';

import { LOCALE_COOKIE } from '@/lib/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export function useLanguageSwitcher() {
  const [pending, startTransition] = useTransition();

  const changeLocale = (locale: string) => {
    startTransition(async () => {
      await fetch('/api/set-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
        credentials: 'same-origin',
      });
      document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
      window.location.reload();
    });
  };

  return { changeLocale, pending };
}
