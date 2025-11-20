import { ReactNode } from 'react';
import { logoutAction } from '@/lib/actions/auth';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function TopBar({ user, actions }: { user: User; actions?: ReactNode }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-slate-500">ログイン中</span>
        <span className="text-base font-semibold text-slate-900 dark:text-white">{name}</span>
        <span className="text-xs text-slate-400">{user.role}</span>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            ログアウト
          </Button>
        </form>
      </div>
    </header>
  );
}
