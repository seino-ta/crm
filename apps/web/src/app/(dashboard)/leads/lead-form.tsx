'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { createLeadAction, type LeadActionState } from '@/lib/actions/leads';
import { FloatingInput, FloatingSelect, FloatingTextarea } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';
import { useI18n } from '@/components/providers/i18n-provider';
import { getLeadStatusOptions } from '@/lib/labels';

type LeadFormProps = {
  owners: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
  defaultOwnerId: string;
};

export function LeadForm({ owners, accounts, defaultOwnerId }: LeadFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<LeadActionState | undefined, FormData>(createLeadAction, undefined);
  const { t: tToast } = useI18n('toasts');
  const { t: tForm, locale } = useI18n('leads.form');
  const { t: tErrors } = useI18n('leads.errors');
  const statusOptions = useMemo(() => getLeadStatusOptions(locale), [locale]);
  const initialSnapshot = useMemo(() => JSON.stringify({ ownerId: defaultOwnerId }), [defaultOwnerId]);
  const { toastTrigger, handleSubmitSnapshot, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast } = useFormSuccessToast({
    formId: 'leads:create',
    initialSnapshot,
    matchInitialSnapshot: false,
    message: tToast('leadCreated'),
  });
  const successToastTrigger = toastTrigger ?? undefined;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      triggerImmediateToast();
      handleSuccessPersist();
      setTimeout(() => router.refresh(), 0);
    } else if (state.error) {
      handleErrorCleanup();
    }
  }, [state, router, handleErrorCleanup, handleSuccessPersist, triggerImmediateToast]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      data-testid="lead-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <FloatingInput name="name" label={tForm('nameLabel')} example={tForm('namePlaceholder')} required />
      <FloatingInput name="company" label={tForm('companyLabel')} example={tForm('companyPlaceholder')} />
      <FloatingInput name="email" type="email" label={tForm('emailLabel')} example={tForm('emailPlaceholder')} />
      <FloatingInput name="phone" label={tForm('phoneLabel')} example={tForm('phonePlaceholder')} />
      <FloatingSelect name="status" label={tForm('statusLabel')} defaultValue="NEW" required>
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FloatingSelect>
      <FloatingSelect name="ownerId" label={tForm('ownerLabel')} defaultValue={defaultOwnerId} required>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name}
          </option>
        ))}
      </FloatingSelect>
      <FloatingSelect name="accountId" label={tForm('accountLabel')} defaultValue="" forceFloatLabel>
        <option value="">{tForm('accountPlaceholder')}</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </FloatingSelect>
      <FloatingInput name="source" label={tForm('sourceLabel')} example={tForm('sourcePlaceholder')} />
      <FloatingTextarea name="notes" label={tForm('notesLabel')} example={tForm('notesPlaceholder')} rows={3} />
      <SuccessToast trigger={successToastTrigger} message={tToast('leadCreated')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full">
        {tForm('submit')}
      </Button>
    </form>
  );
}
