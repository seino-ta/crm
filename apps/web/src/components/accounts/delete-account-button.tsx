'use client';

import { useTransition } from 'react';

import { deleteAccountAction } from '@/lib/actions/accounts';
import { Button } from '@/components/ui/button';

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('このアカウントを削除しますか？関連するデータに影響する場合があります。')) return;
        startTransition(async () => {
          await deleteAccountAction(accountId);
        });
      }}
    >
      {pending ? '削除中…' : '削除'}
    </Button>
  );
}
