export const locales = ['ja', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';
export const LOCALE_COOKIE = 'crm_locale';

export function isLocale(value?: string | null): value is Locale {
  if (!value) return false;
  return locales.includes(value as Locale);
}
