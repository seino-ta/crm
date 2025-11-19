'use client';

import { useActionState } from 'react';

import { loginAction } from '@/lib/actions/auth';
import type { AuthFormState } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const [state, action] = useActionState<AuthFormState | undefined, FormData>(loginAction, undefined);

  return (
    <form action={action} className="space-y-4" data-testid="login-form">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-600">
          メールアドレス
        </label>
        <Input type="email" id="email" name="email" required placeholder="admin@crm.local" autoFocus data-testid="login-email" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-600">
          パスワード
        </label>
        <Input type="password" id="password" name="password" required placeholder="••••••••" data-testid="login-password" />
      </div>
      {state?.error && <p className="text-sm text-rose-600" data-testid="login-error">{state.error}</p>}
      <Button type="submit" className="w-full" data-testid="login-submit">
        サインイン
      </Button>
    </form>
  );
}
