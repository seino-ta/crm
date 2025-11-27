'use client';

import { useActionState, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createTaskAction, type TaskActionState } from '@/lib/actions/tasks';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { getTaskPriorityOptions } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';
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
      <div className="space-y-1">
        <label htmlFor="task-title" className="text-sm font-medium text-slate-600">
          {tForm('nameLabel')}
          <RequiredMark />
        </label>
        <Input id="task-title" name="title" placeholder={tForm('namePlaceholder')} required aria-label={tForm('nameLabel')} />
      </div>
      <Textarea name="description" rows={3} placeholder={tForm('descriptionPlaceholder')} aria-label={tForm('descriptionPlaceholder')} />
      <div className="space-y-1">
        <label htmlFor="task-priority" className="text-sm font-medium text-slate-600">
          {tForm('priorityLabel')}
          <RequiredMark />
        </label>
        <Select id="task-priority" name="priority" defaultValue="MEDIUM" aria-label={tForm('priorityLabel')}>
          {priorityOptions.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label htmlFor="task-due" className="text-sm font-medium text-slate-600">
          {tForm('dueLabel')}
        </label>
        <Input id="task-due" name="dueDate" type="date" aria-label={tForm('dueLabel')} />
      </div>
      <div className="space-y-1">
        <label htmlFor="task-account" className="text-sm font-medium text-slate-600">
          {tForm('accountLabel')}
        </label>
        <Select
          id="task-account"
          name="accountId"
          value={selectedAccountId}
          onChange={(event) => setSelectedAccountId(event.target.value)}
          aria-label={tForm('accountLabel')}
        >
          <option value="">{tForm('accountPlaceholder')}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label htmlFor="task-opportunity" className="text-sm font-medium text-slate-600">
          {tForm('opportunityLabel')}
        </label>
        <Select
          id="task-opportunity"
          name="opportunityId"
          value={selectedOpportunityId}
          onChange={(event) => setSelectedOpportunityId(event.target.value)}
          aria-label={tForm('opportunityLabel')}
          disabled={selectedAccountId !== '' && filteredOpportunities.length === 0}
        >
          <option value="">{tForm('opportunityPlaceholder')}</option>
          {filteredOpportunities.map((opp) => (
            <option key={opp.id} value={opp.id}>
              {opp.name}
            </option>
          ))}
        </Select>
      </div>
      <input type="hidden" name="ownerId" value={ownerId} />
      <SuccessToast trigger={successToastTrigger} message={tToast('taskCreated')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full">
        {tForm('submit')}
      </Button>
    </form>
  );
}
