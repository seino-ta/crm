'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { createOpportunityAction, type OpportunityActionState } from '@/lib/actions/opportunities';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { getPipelineStageLabel } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';
import { useI18n } from '@/components/providers/i18n-provider';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';

export type OpportunityFormProps = {
  accounts: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  ownerId: string;
};

export function OpportunityForm({ accounts, stages, contacts, ownerId }: OpportunityFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<OpportunityActionState | undefined, FormData>(createOpportunityAction, undefined);
  const { t: tToast } = useI18n('toasts');
  const { t, locale } = useI18n('opportunities.form');
  const { t: tErrors } = useI18n('opportunities.errors');
  const stageOptions = useMemo(() => stages.map((stage) => ({ id: stage.id, name: getPipelineStageLabel(stage.name, locale) })), [stages, locale]);
  const initialSnapshot = useMemo(() => JSON.stringify({ ownerId }), [ownerId]);
  const { toastTrigger, handleSubmitSnapshot, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast } = useFormSuccessToast({
    formId: 'opportunities:create',
    initialSnapshot,
    matchInitialSnapshot: false,
    message: tToast('opportunityCreated'),
  });
  const successToastTrigger = toastTrigger ?? undefined;

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
      data-testid="opportunity-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <div className="space-y-1">
        <label htmlFor="opportunity-name" className="app-form-label">
          {t('nameLabel')}<RequiredMark />
        </label>
        <Input id="opportunity-name" name="name" placeholder={t('namePlaceholder')} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="opportunity-account" className="app-form-label">
            {t('accountLabel')}<RequiredMark />
          </label>
          <Select id="opportunity-account" name="accountId" required defaultValue="">
            <option value="" disabled>
              {t('accountPlaceholder')}
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="opportunity-stage" className="app-form-label">
            {t('stageLabel')}<RequiredMark />
          </label>
          <Select id="opportunity-stage" name="stageId" required defaultValue="">
            <option value="" disabled>
              {t('stagePlaceholder')}
            </option>
            {stageOptions.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="amount" type="number" min={0} placeholder={t('amountPlaceholder')} />
        <Input name="probability" type="number" min={0} max={100} placeholder={t('probabilityPlaceholder')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="expectedCloseDate" type="date" aria-label={t('dateLabel')} />
        <Select name="contactId" defaultValue="">
          <option value="">{t('contactNone')}</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </Select>
      </div>
      <Textarea name="description" rows={3} placeholder={t('descriptionPlaceholder')} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <SuccessToast trigger={successToastTrigger} message={tToast('opportunityCreated')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full">
        {t('submit')}
      </Button>
    </form>
  );
}
