'use client';

import { useActionState } from 'react';

import { inviteUserAction, type InviteUserActionState } from '@/lib/actions/users';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { useI18n } from '@/components/providers/i18n-provider';

const roles = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'REP', label: 'Rep' },
];

export function InviteUserForm() {
  const [state, formAction] = useActionState<InviteUserActionState | undefined, FormData>(inviteUserAction, undefined);
  const { t } = useI18n('users.invite');
  const { t: tErrors } = useI18n('users.errors');
  const { t: tUsers } = useI18n('users');

  return (
    <form action={formAction} className="space-y-3" data-testid="invite-user-form">
      <div>
        <label className="app-form-label" htmlFor="invite-email">
          {t('email')}
        </label>
        <Input id="invite-email" name="email" type="email" required placeholder="user@example.com" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="firstName" placeholder={t('firstPlaceholder')} aria-label={t('firstPlaceholder')} />
        <Input name="lastName" placeholder={t('lastPlaceholder')} aria-label={t('lastPlaceholder')} />
      </div>
      <Input name="title" placeholder={t('titlePlaceholder')} aria-label={t('titlePlaceholder')} />
      <Input name="phone" placeholder={t('phonePlaceholder')} aria-label={t('phonePlaceholder')} />
      <div>
        <label className="app-form-label" htmlFor="invite-role">
          {t('role')}
        </label>
        <Select id="invite-role" name="role" defaultValue="REP" required>
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {tUsers(`roles.${role.value.toLowerCase()}`)}
            </option>
          ))}
        </Select>
      </div>
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      {state?.password && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm" data-testid="invite-temp-password">
          <p className="font-medium">{t('passwordLabel')}</p>
          <p className="font-mono">{state.password}</p>
        </div>
      )}
      <Button type="submit" className="w-full" data-testid="invite-submit">
        {t('submit')}
      </Button>
      <SuccessToast trigger={state?.ok ? state : undefined} message={t('toast')} />
    </form>
  );
}
