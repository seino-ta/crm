'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { restoreAccountAction } from '@/lib/actions/accounts';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { useSuccessToast } from '@/hooks/use-success-toast';
import { useI18n } from '@/components/providers/i18n-provider';

export function RestoreAccountButton({ accountId }: { accountId: string }) {
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
        variant="secondary"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            try {
              const result = await restoreAccountAction(accountId);
              if (result?.error) {
                alert(actionText('restoreError'));
                return;
              }
              showToast(toast('accountRestored'));
              router.refresh();
            } catch (error) {
              console.error(error);
              alert(actionText('restoreError'));
            }
          });
        }}
      >
        {pending ? t('updating') : t('restore')}
      </Button>
      {message && <SuccessToast open={open} message={message} />}
    </>
  );
}
