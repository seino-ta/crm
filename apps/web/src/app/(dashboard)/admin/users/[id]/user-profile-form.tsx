'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/floating-field';
import { SuccessToast } from '@/components/ui/success-modal';
import { useI18n } from '@/components/providers/i18n-provider';
import { updateUserAction, type UserActionState } from '@/lib/actions/users';

export type UserProfileFormProps = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  phone?: string | null;
  revalidatePath: string;
};

async function handleAction(userId: string, revalidatePath: string, _state: UserActionState | undefined, formData: FormData) {
  return (await updateUserAction(userId, formData, revalidatePath)) ?? undefined;
}

export function UserProfileForm({ userId, firstName, lastName, title, phone, revalidatePath }: UserProfileFormProps) {
  const [state, formAction] = useActionState<UserActionState | undefined, FormData>(
    handleAction.bind(null, userId, revalidatePath),
    undefined
  );
  const { t } = useI18n('users');
  const { t: tErrors } = useI18n('users.errors');

  return (
    <form className="space-y-3" action={formAction} data-testid="user-detail-form">
      <div className="grid gap-3 md:grid-cols-2">
        <FloatingInput
          id="detail-first"
          name="firstName"
          label={t('details.firstName')}
          defaultValue={firstName ?? ''}
          example={t('invite.firstPlaceholder')}
        />
        <FloatingInput
          id="detail-last"
          name="lastName"
          label={t('details.lastName')}
          defaultValue={lastName ?? ''}
          example={t('invite.lastPlaceholder')}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FloatingInput
          id="detail-title"
          name="title"
          label={t('details.title')}
          defaultValue={title ?? ''}
          example={t('invite.titlePlaceholder')}
        />
        <FloatingInput
          id="detail-phone"
          name="phone"
          label={t('details.phone')}
          defaultValue={phone ?? ''}
          example={t('invite.phonePlaceholder')}
        />
      </div>
      {state?.error && <p className="text-xs text-rose-600">{tErrors(state.error)}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary">
          {t('detail.actions.saveDetails')}
        </Button>
      </div>
      <SuccessToast trigger={state?.ok ? state : undefined} message={t('detail.toasts.profileSaved')} />
    </form>
  );
}
