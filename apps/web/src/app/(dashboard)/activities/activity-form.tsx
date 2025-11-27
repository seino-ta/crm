'use client';

import { useActionState, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createActivityAction, type ActivityActionState } from '@/lib/actions/activities';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';

import { getActivityTypeOptions } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';
import { useI18n } from '@/components/providers/i18n-provider';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';

type ActivityFormProps = {
  accounts: { id: string; name: string }[];
  opportunities: { id: string; name: string; accountId: string }[];
  userId: string;
};

export function ActivityForm({ accounts, opportunities, userId }: ActivityFormProps) {
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
      data-testid="activity-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <div className="space-y-1">
        <label htmlFor="activity-type" className="text-sm font-medium text-slate-600">
          {t('typeLabel')}<RequiredMark />
        </label>
        <Select id="activity-type" name="type" defaultValue="CALL">
          {typeOptions.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label htmlFor="activity-subject" className="text-sm font-medium text-slate-600">
          {t('subjectLabel')}<RequiredMark />
        </label>
        <Input id="activity-subject" name="subject" placeholder={t('subjectPlaceholder')} required />
      </div>
      <Textarea name="description" rows={3} placeholder={t('descriptionPlaceholder')} />
      <Select
        name="accountId"
        value={selectedAccountId}
        onChange={(event) => {
          setSelectedAccountId(event.target.value);
        }}
      >
        <option value="">{t('accountPlaceholder')}</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>
      <Select
        name="opportunityId"
        value={selectedOpportunityId}
        onChange={(event) => setSelectedOpportunityId(event.target.value)}
        disabled={selectedAccountId !== '' && filteredOpportunities.length === 0}
      >
        <option value="">{selectedAccountId ? t('opportunityPlaceholder') : t('opportunityPlaceholder')}</option>
        {filteredOpportunities.map((opp) => (
          <option key={opp.id} value={opp.id}>
            {opp.name}
          </option>
        ))}
      </Select>
      <input type="hidden" name="userId" value={userId} />
      <SuccessToast trigger={successToastTrigger} message={tToast('activityCreated')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full">
        {t('submit')}
      </Button>
    </form>
  );
}
