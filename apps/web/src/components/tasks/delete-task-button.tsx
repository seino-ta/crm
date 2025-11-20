'use client';

import { useTransition } from 'react';

import { deleteTaskAction } from '@/lib/actions/tasks';
import { Button } from '@/components/ui/button';

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('このタスクを削除しますか？')) return;
        startTransition(async () => {
          await deleteTaskAction(taskId);
        });
      }}
    >
      {pending ? '削除中…' : '削除'}
    </Button>
  );
}
