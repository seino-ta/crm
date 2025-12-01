'use client';

import { useActionState, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createTaskAction, type TaskActionState } from '@/lib/actions/tasks';
import { FloatingInput, FloatingSelect, FloatingTextarea } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { getTaskPriorityOptions } from '@/lib/labels';
import { useI18n } from '@/components/providers/i18n-provider';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';

type TaskFormProps = {
  accounts: { id: string; name: string }[];
  opportunities: { id: string; name: string; accountId: string }[];
  ownerId: string;
};

export function TaskForm({ accounts, opportunities, ownerId }: TaskFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<TaskActionState | undefined, FormData>(createTaskAction, undefined);
  const { t: tToast } = useI18n('toasts');
  const { t: tForm, locale } = useI18n('tasks.form');
  const { t: tErrors } = useI18n('tasks.errors');
  const priorityOptions = useMemo(() => getTaskPriorityOptions(locale), [locale]);
  const initialSnapshot = useMemo(() => JSON.stringify({ ownerId }), [ownerId]);
  const { toastTrigger, handleSubmitSnapshot, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast } = useFormSuccessToast({
    formId: 'tasks:create',
    initialSnapshot,
    matchInitialSnapshot: false,
    message: tToast('taskCreated'),
  });
  const successToastTrigger = toastTrigger ?? undefined;
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('');
  const filteredOpportunities = useMemo(() => {
    if (!selectedAccountId) return opportunities;
    return opportunities.filter((opp) => opp.accountId === selectedAccountId);
  }, [opportunities, selectedAccountId]);
  const resetSelectedOpportunity = useEffectEvent(() => {
    setSelectedOpportunityId('');
  });

  useEffect(() => {
    if (!selectedOpportunityId) return;
    if (filteredOpportunities.some((opp) => opp.id === selectedOpportunityId)) return;
    resetSelectedOpportunity();
  }, [filteredOpportunities, selectedOpportunityId]);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      triggerImmediateToast();
      handleSuccessPersist();
      setTimeout(() => {
        router.refresh();
      }, 0);
    } else if (state.error) {
      handleErrorCleanup();
    }
  }, [state, router, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      data-testid="task-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <FloatingInput
        id="task-title"
        name="title"
        label={tForm('nameLabel')}
        example={tForm('namePlaceholder')}
        required
      />
      <FloatingTextarea name="description" label={tForm('descriptionLabel')} example={tForm('descriptionPlaceholder')} rows={3} />
      <FloatingSelect id="task-priority" name="priority" label={tForm('priorityLabel')} defaultValue="MEDIUM" required>
        {priorityOptions.map((priority) => (
          <option key={priority.value} value={priority.value}>
            {priority.label}
          </option>
        ))}
      </FloatingSelect>
      <FloatingInput id="task-due" name="dueDate" type="date" label={tForm('dueLabel')} />
      <FloatingSelect
        id="task-account"
        name="accountId"
        label={tForm('accountLabel')}
        value={selectedAccountId}
        onChange={(event) => setSelectedAccountId(event.target.value)}
        forceFloatLabel
      >
        <option value="">{tForm('accountPlaceholder')}</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </FloatingSelect>
      <FloatingSelect
        id="task-opportunity"
        name="opportunityId"
        label={tForm('opportunityLabel')}
        value={selectedOpportunityId}
        onChange={(event) => setSelectedOpportunityId(event.target.value)}
        disabled={selectedAccountId !== '' && filteredOpportunities.length === 0}
        forceFloatLabel
      >
        <option value="">{tForm('opportunityPlaceholder')}</option>
        {filteredOpportunities.map((opp) => (
          <option key={opp.id} value={opp.id}>
            {opp.name}
          </option>
        ))}
      </FloatingSelect>
      <input type="hidden" name="ownerId" value={ownerId} />
      <SuccessToast trigger={successToastTrigger} message={tToast('taskCreated')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full">
        {tForm('submit')}
      </Button>
    </form>
  );
}
