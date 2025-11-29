'use client';

import { useActionState } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        <div>
          <label className="app-form-label text-xs" htmlFor="detail-first">
            {t('details.firstName')}
          </label>
          <Input id="detail-first" name="firstName" defaultValue={firstName ?? ''} placeholder={t('invite.firstPlaceholder')} />
        </div>
        <div>
          <label className="app-form-label text-xs" htmlFor="detail-last">
            {t('details.lastName')}
          </label>
          <Input id="detail-last" name="lastName" defaultValue={lastName ?? ''} placeholder={t('invite.lastPlaceholder')} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="app-form-label text-xs" htmlFor="detail-title">
            {t('details.title')}
          </label>
          <Input id="detail-title" name="title" defaultValue={title ?? ''} placeholder={t('invite.titlePlaceholder')} />
        </div>
        <div>
          <label className="app-form-label text-xs" htmlFor="detail-phone">
            {t('details.phone')}
          </label>
          <Input id="detail-phone" name="phone" defaultValue={phone ?? ''} placeholder={t('invite.phonePlaceholder')} />
        </div>
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
