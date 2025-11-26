'use client';

import { useTransition } from 'react';

import { deleteTaskAction } from '@/lib/actions/tasks';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { useSuccessToast } from '@/hooks/use-success-toast';
import { useI18n } from '@/components/providers/i18n-provider';

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const { open, message, showToast } = useSuccessToast();
  const { t: buttons } = useI18n('buttons');
  const { t } = useI18n('tasks');
  const { t: toasts } = useI18n('toasts');

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t('deleteConfirm'))) return;
          startTransition(async () => {
            try {
              await deleteTaskAction(taskId);
              showToast(toasts('taskDeleted'));
            } catch (error) {
              console.error(error);
              alert(t('deleteError'));
            }
          });
        }}
      >
        {pending ? buttons('updating') : buttons('delete')}
      </Button>
      {message && <SuccessToast open={open} message={message} />}
    </>
  );
}
