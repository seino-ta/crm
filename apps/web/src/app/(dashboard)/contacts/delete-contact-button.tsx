'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/providers/i18n-provider';
import { useToastContext } from '@/components/providers/toast-provider';
import { deleteContactAction } from '@/lib/actions/contacts';

type DeleteContactButtonProps = {
  contactId: string;
  accountId?: string | null;
  contactName: string;
  testId?: string;
};

export function DeleteContactButton({ contactId, accountId, contactName, testId }: DeleteContactButtonProps) {
  const { t } = useI18n('contacts.list.actions');
  const toast = useToastContext();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmation = t('confirm', { values: { name: contactName } });
    if (typeof window !== 'undefined' && !window.confirm(confirmation)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteContactAction(contactId, accountId);
      if (result?.error) {
        toast?.showToast(t('deleteFailed'));
        return;
      }
      toast?.showToast(t('deleted'));
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-rose-600 hover:text-rose-700"
      onClick={handleDelete}
      disabled={pending}
      data-testid={testId}
    >
      {t('delete')}
    </Button>
  );
}
