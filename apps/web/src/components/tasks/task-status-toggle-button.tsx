'use client';

import { useTransition } from 'react';

import { toggleTaskStatusAction } from '@/lib/actions/tasks';
import type { TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { useSuccessToast } from '@/hooks/use-success-toast';
import { useI18n } from '@/components/providers/i18n-provider';

export function TaskStatusToggleButton({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [pending, startTransition] = useTransition();
  const { open, message, showToast } = useSuccessToast();
  const { t: buttons } = useI18n('buttons');
  const { t } = useI18n('tasks.toggle');
  const { t: toasts } = useI18n('toasts');
  const { t: errors } = useI18n('tasks.errors');
  const isCompleted = status === 'COMPLETED';
  const label = isCompleted ? t('reopen') : t('complete');
  const toastKey = isCompleted ? 'taskReopened' : 'taskCompleted';

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={isCompleted ? 'secondary' : 'primary'}
        disabled={pending}
        data-testid="task-toggle"
        onClick={() => {
          startTransition(async () => {
            try {
              await toggleTaskStatusAction(taskId, status);
              showToast(toasts(toastKey));
            } catch (error) {
              console.error(error);
              alert(errors('statusUpdate'));
            }
          });
        }}
      >
        {pending ? buttons('updating') : label}
      </Button>
      {message && <SuccessToast open={open} message={message} />}
    </>
  );
}
