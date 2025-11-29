'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { useI18n } from '@/components/providers/i18n-provider';
import { toggleUserStatusAction, type UserActionState } from '@/lib/actions/users';

async function handleStatus(userId: string, nextStatus: boolean, revalidatePath: string, _state: UserActionState | undefined, formData: FormData) {
  return (await toggleUserStatusAction(userId, nextStatus, revalidatePath)) ?? undefined;
}

export function UserStatusForm({ userId, isActive, revalidatePath }: { userId: string; isActive: boolean; revalidatePath: string }) {
  const [state, formAction] = useActionState<UserActionState | undefined, FormData>(
    handleStatus.bind(null, userId, !isActive, revalidatePath),
    undefined
  );
  const { t } = useI18n('users');

  return (
    <form
      className="flex flex-col items-start gap-2"
      action={formAction}
      data-testid="user-status-form"
      onSubmit={(event) => {
        const message = isActive ? t('list.actions.confirmDeactivate') : t('list.actions.confirmActivate');
        if (!window.confirm(message)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <p className="text-xs text-slate-500">{t('detail.actions.statusHint')}</p>
      <Button type="submit" size="sm" variant={isActive ? 'danger' : 'secondary'}>
        {isActive ? t('detail.actions.deactivate') : t('detail.actions.activate')}
      </Button>
      <SuccessToast trigger={state?.ok ? state : undefined} message={isActive ? t('detail.toasts.deactivated') : t('detail.toasts.activated')} />
    </form>
  );
}
