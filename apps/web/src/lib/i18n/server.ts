import { getLocale } from './get-locale';
import { getMessages } from './messages';
import type { Locale } from './config';
import { createTranslator } from './translator';

export async function getServerLocale(): Promise<Locale> {
  return getLocale();
}

export async function getServerTranslations(namespace?: string) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const t = createTranslator(messages, namespace);
  return { locale, messages, t };
}
