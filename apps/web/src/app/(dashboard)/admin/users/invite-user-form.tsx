'use client';

import { useActionState } from 'react';

import { inviteUserAction, type InviteUserActionState } from '@/lib/actions/users';
import { Button } from '@/components/ui/button';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field';
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
      <FloatingInput
        id="invite-email"
        name="email"
        type="email"
        label={t('email')}
        example="user@example.com"
        required
        autoComplete="email"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <FloatingInput
          id="invite-first"
          name="firstName"
          label={tUsers('details.firstName')}
          example={t('firstPlaceholder')}
          aria-label={t('firstPlaceholder')}
        />
        <FloatingInput
          id="invite-last"
          name="lastName"
          label={tUsers('details.lastName')}
          example={t('lastPlaceholder')}
          aria-label={t('lastPlaceholder')}
        />
      </div>
      <FloatingInput
        id="invite-title"
        name="title"
        label={tUsers('details.title')}
        example={t('titlePlaceholder')}
        aria-label={t('titlePlaceholder')}
      />
      <FloatingInput
        id="invite-phone"
        name="phone"
        label={tUsers('details.phone')}
        example={t('phonePlaceholder')}
        aria-label={t('phonePlaceholder')}
      />
      <FloatingSelect id="invite-role" name="role" label={t('role')} defaultValue="REP" required>
        {roles.map((role) => (
          <option key={role.value} value={role.value}>
            {tUsers(`roles.${role.value.toLowerCase()}`)}
          </option>
        ))}
      </FloatingSelect>
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
