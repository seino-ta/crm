'use client';

import { useActionState, useState } from 'react';

import { loginAction } from '@/lib/actions/auth';
import type { AuthFormState } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredMark } from '@/components/ui/required-mark';
import { useI18n } from '@/components/providers/i18n-provider';

export function LoginForm() {
  // loginAction は AuthFormState | void を返すため、useActionState の戻り値型を合わせる
  const [state, action] = useActionState<AuthFormState | undefined, FormData>(async (prev, form) => {
    const result = await loginAction(prev, form);
    return result ?? undefined;
  }, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useI18n('auth');
  const { t: tErrors } = useI18n('auth.errors');

  return (
    <form action={action} className="space-y-4" data-testid="login-form">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-600">
          {t('email')}<RequiredMark />
        </label>
        <Input type="email" id="email" name="email" required placeholder="admin@crm.local" autoFocus data-testid="login-email" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-600">
          {t('password')}<RequiredMark />
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            required
            placeholder="••••••••"
            data-testid="login-password"
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? t('hide') : t('show')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
            onClick={() => setShowPassword((prev) => !prev)}
            data-testid="password-toggle"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M9.88 9.88a3 3 0 004.24 4.24M6.1 6.3C4.53 7.34 3.2 8.86 2.25 10.75c2.3 4.6 6.12 7.25 9.75 7.25 1.34 0 2.63-.28 3.84-.81M17.9 17.7c1.57-1.04 2.9-2.56 3.85-4.45-2.3-4.6-6.12-7.25-9.75-7.25-1.27 0-2.49.25-3.6.72"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
                aria-hidden
              >
                <path
                  d="M2.25 12c2.3-4.6 6.12-7.25 9.75-7.25s7.45 2.65 9.75 7.25c-2.3 4.6-6.12 7.25-9.75 7.25S4.55 16.6 2.25 12z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {state?.error && <p className="text-sm text-rose-600" data-testid="login-error">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full" data-testid="login-submit">
        {t('submit')}
      </Button>
    </form>
  );
}
