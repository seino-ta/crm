"use client";

import { ReactNode } from 'react';
import { logoutAction } from '@/lib/actions/auth';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/providers/i18n-provider';
import { LanguageSwitcher } from '@/components/language-switcher';

export function TopBar({ user, actions }: { user: User; actions?: ReactNode }) {
  const { t } = useI18n('buttons');
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-slate-500">{t('loggedInLabel', 'Logged in')}</span>
        <span className="text-base font-semibold text-slate-900">{name}</span>
        <span className="text-xs text-slate-400">{user.role}</span>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {actions}
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            {t('logout')}
          </Button>
        </form>
      </div>
    </header>
  );
}
