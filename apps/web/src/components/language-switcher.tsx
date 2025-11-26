'use client';

import clsx from 'clsx';

import { locales } from '@/lib/i18n/config';
import { useI18n } from '@/components/providers/i18n-provider';
import { useLanguageSwitcher } from '@/hooks/use-language-switcher';

export function LanguageSwitcher() {
  const { locale, t } = useI18n('common');
  const { changeLocale, pending } = useLanguageSwitcher();

  return (
    <div
      className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-medium"
      role="group"
      aria-label={t('language')}
    >
      {locales.map((item) => {
        const isActive = item === locale;
        return (
          <button
            key={item}
            type="button"
            className={clsx(
              'rounded-full px-4 py-1 transition focus-visible:outline-none',
              isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
            )}
            disabled={pending || isActive}
            aria-pressed={isActive}
            onClick={() => changeLocale(item)}
          >
            {t(`languageNames.${item}`)}
          </button>
        );
      })}
    </div>
  );
}
