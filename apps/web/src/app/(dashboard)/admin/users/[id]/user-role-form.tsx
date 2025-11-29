'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { FloatingSelect } from '@/components/ui/floating-field';
import { SuccessToast } from '@/components/ui/success-modal';
import { useI18n } from '@/components/providers/i18n-provider';
import { updateUserAction, type UserActionState } from '@/lib/actions/users';
import type { UserRole } from '@/lib/types';

const roleOptions: UserRole[] = ['ADMIN', 'MANAGER', 'REP'];

async function handleRole(userId: string, revalidatePath: string, _state: UserActionState | undefined, formData: FormData) {
  return (await updateUserAction(userId, formData, revalidatePath)) ?? undefined;
}

export function UserRoleForm({ userId, currentRole, revalidatePath }: { userId: string; currentRole: UserRole; revalidatePath: string }) {
  const [state, formAction] = useActionState<UserActionState | undefined, FormData>(handleRole.bind(null, userId, revalidatePath), undefined);
  const { t } = useI18n('users');
  const { t: tErrors } = useI18n('users.errors');

  return (
    <form className="flex flex-col gap-2" action={formAction} data-testid="user-role-form">
      <FloatingSelect id="detail-role" name="role" label={t('list.headers.role')} defaultValue={currentRole}>
        {roleOptions.map((option) => (
          <option key={option} value={option}>
            {t(`roles.${option.toLowerCase()}`)}
          </option>
        ))}
      </FloatingSelect>
      {state?.error && <p className="text-xs text-rose-600">{tErrors(state.error)}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary">
          {t('list.actions.saveRole')}
        </Button>
      </div>
      <SuccessToast trigger={state?.ok ? state : undefined} message={t('detail.toasts.roleSaved')} />
    </form>
  );
}
