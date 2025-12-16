'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { createOpportunityAction, type OpportunityActionState } from '@/lib/actions/opportunities';
import { FloatingInput, FloatingSelect, FloatingTextarea } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { getPipelineStageLabel } from '@/lib/labels';
import { useI18n } from '@/components/providers/i18n-provider';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';

export type OpportunityFormProps = {
  accounts: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  ownerId: string;
  onSuccess?: () => void;
};

export function OpportunityForm({ accounts, stages, contacts, ownerId, onSuccess }: OpportunityFormProps) {
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
      data-testid="opportunity-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <FloatingInput name="name" label={t('nameLabel')} example={t('namePlaceholder')} required />
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingSelect name="accountId" label={t('accountLabel')} required defaultValue="" forceFloatLabel>
          <option value="" disabled>
            {t('accountPlaceholder')}
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect name="stageId" label={t('stageLabel')} required defaultValue="" forceFloatLabel>
          <option value="" disabled>
            {t('stagePlaceholder')}
          </option>
          {stageOptions.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </FloatingSelect>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput name="amount" type="number" min={0} label={t('amountLabel')} example={t('amountPlaceholder')} />
        <FloatingInput name="probability" type="number" min={0} max={100} label={t('probabilityLabel')} example={t('probabilityPlaceholder')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput name="expectedCloseDate" type="date" label={t('dateLabel')} />
        <FloatingSelect name="contactId" label={t('contactLabel')} defaultValue="" forceFloatLabel>
          <option value="">{t('contactNone')}</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </FloatingSelect>
      </div>
      <FloatingTextarea name="description" rows={3} label={t('descriptionLabel')} example={t('descriptionPlaceholder')} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <SuccessToast trigger={successToastTrigger} message={tToast('opportunityCreated')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full">
        {t('submit')}
      </Button>
    </form>
  );
}
