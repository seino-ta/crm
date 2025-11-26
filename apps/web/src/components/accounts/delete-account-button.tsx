'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteAccountAction } from '@/lib/actions/accounts';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { useSuccessToast } from '@/hooks/use-success-toast';
import { useI18n } from '@/components/providers/i18n-provider';

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { open, message, showToast } = useSuccessToast();
  const { t } = useI18n('buttons');
  const { t: toast } = useI18n('toasts');
  const { t: actionText } = useI18n('accounts.actions');

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(actionText('deleteConfirm'))) return;
          startTransition(async () => {
            try {
              await deleteAccountAction(accountId);
              showToast(toast('accountDeleted'));
              router.push('/accounts');
              router.refresh();
            } catch (error) {
              console.error(error);
              alert(actionText('deleteError'));
            }
          });
        }}
      >
        {pending ? t('updating') : t('delete')}
      </Button>
      {message && <SuccessToast open={open} message={message} />}
    </>
  );
}
