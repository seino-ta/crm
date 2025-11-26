import { ja } from '@/locales/ja';
import { en } from '@/locales/en';
import { defaultLocale, type Locale } from './config';

export type Messages = typeof ja;

const dictionaries: Record<Locale, Messages> = {
  ja,
  en,
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
