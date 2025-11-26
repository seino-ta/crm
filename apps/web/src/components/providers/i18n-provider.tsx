'use client';

import { createContext, useContext, useMemo } from 'react';

import type { Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/messages';
import { createTranslator } from '@/lib/i18n/translator';

export type I18nContextValue = {
  locale: Locale;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, messages, children }: I18nContextValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

export function useI18n(namespace?: string) {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  const t = useMemo(() => createTranslator(ctx.messages, namespace), [ctx.messages, namespace]);
  return {
    locale: ctx.locale,
    t,
  };
}
