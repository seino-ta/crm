'use client';

import { useTransition } from 'react';

import { deleteActivityAction } from '@/lib/actions/activities';
import { Button } from '@/components/ui/button';

export function DeleteActivityButton({ activityId }: { activityId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('この活動ログを削除しますか？')) return;
        startTransition(async () => {
          await deleteActivityAction(activityId);
        });
      }}
    >
      {pending ? '削除中…' : '削除'}
    </Button>
  );
}
