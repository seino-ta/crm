'use client';

import { useActionState, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createActivityAction, type ActivityActionState } from '@/lib/actions/activities';
import { FloatingInput, FloatingSelect, FloatingTextarea } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';

import { getActivityTypeOptions } from '@/lib/labels';
import { useI18n } from '@/components/providers/i18n-provider';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';

type ActivityFormProps = {
  accounts: { id: string; name: string }[];
  opportunities: { id: string; name: string; accountId: string }[];
  userId: string;
  onSuccess?: () => void;
};

export function ActivityForm({ accounts, opportunities, userId, onSuccess }: ActivityFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<ActivityActionState | undefined, FormData>(createActivityAction, undefined);
  const { t: tToast } = useI18n('toasts');
  const { t, locale } = useI18n('activities.form');
  const { t: tErrors } = useI18n('activities.errors');
  const typeOptions = useMemo(() => getActivityTypeOptions(locale), [locale]);
  const initialSnapshot = useMemo(() => JSON.stringify({ userId }), [userId]);
  const { toastTrigger, handleSubmitSnapshot, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast } = useFormSuccessToast({
    formId: 'activities:create',
    initialSnapshot,
    matchInitialSnapshot: false,
    message: tToast('activityCreated'),
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
      onSuccess?.();
      triggerImmediateToast();
      handleSuccessPersist();
      setTimeout(() => {
        router.refresh();
      }, 0);
    } else if (state.error) {
      handleErrorCleanup();
    }
  }, [state, router, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast, onSuccess]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      data-testid="activity-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <FloatingSelect id="activity-type" name="type" label={t('typeLabel')} defaultValue="CALL" required>
        {typeOptions.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </FloatingSelect>
      <FloatingInput id="activity-subject" name="subject" label={t('subjectLabel')} example={t('subjectPlaceholder')} required />
      <FloatingTextarea name="description" label={t('descriptionLabel')} example={t('descriptionPlaceholder')} rows={3} />
      <FloatingSelect
        name="accountId"
        label={t('accountLabel')}
        value={selectedAccountId}
        onChange={(event) => {
          setSelectedAccountId(event.target.value);
        }}
        forceFloatLabel
      >
        <option value="">{t('accountPlaceholder')}</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </FloatingSelect>
      <FloatingSelect
        name="opportunityId"
        label={t('opportunityLabel')}
        value={selectedOpportunityId}
        onChange={(event) => setSelectedOpportunityId(event.target.value)}
        disabled={selectedAccountId !== '' && filteredOpportunities.length === 0}
        forceFloatLabel
      >
        <option value="">{t('opportunityPlaceholder')}</option>
        {filteredOpportunities.map((opp) => (
          <option key={opp.id} value={opp.id}>
            {opp.name}
          </option>
        ))}
      </FloatingSelect>
      <input type="hidden" name="userId" value={userId} />
      <SuccessToast trigger={successToastTrigger} message={tToast('activityCreated')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full">
        {t('submit')}
      </Button>
    </form>
  );
}
