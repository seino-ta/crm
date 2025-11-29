'use client';

import { useActionState } from 'react';

import { createContactAction, updateContactAction, type ContactActionState } from '@/lib/actions/contacts';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { RequiredMark } from '@/components/ui/required-mark';
import { SuccessToast } from '@/components/ui/success-modal';
import { useI18n } from '@/components/providers/i18n-provider';
import type { Contact } from '@/lib/types';

type ContactFormValues = {
  accountId?: string;
  firstName?: string;
  lastName?: string;
  kanaFirstName?: string | null;
  kanaLastName?: string | null;
  email?: string;
  phone?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
};

type ContactFormBaseProps = {
  accounts: { id: string; name: string }[];
  action: (state: ContactActionState | undefined, formData: FormData) => Promise<ContactActionState>;
  initialValues?: ContactFormValues;
  submitLabel?: string;
  toastMessage?: string;
  testId?: string;
  formKey?: string;
  submitTestId?: string;
};

function ContactFormBase({ accounts, action, initialValues, submitLabel, toastMessage, testId = 'contact-form', formKey, submitTestId }: ContactFormBaseProps) {
  const [state, formAction] = useActionState<ContactActionState | undefined, FormData>(action, undefined);
  const { t } = useI18n('contacts.form');
  const { t: tErrors } = useI18n('contacts.errors');
  const submitText = submitLabel ?? t('submit');
  const toastText = toastMessage ?? t('toast');

  return (
    <form key={formKey} action={formAction} className="space-y-3" data-testid={testId}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="app-form-label" htmlFor={`${testId}-first-name`}>
            {t('firstName')}
            <RequiredMark />
          </label>
          <Input id={`${testId}-first-name`} name="firstName" required placeholder={t('firstPlaceholder')} defaultValue={initialValues?.firstName ?? ''} />
        </div>
        <div className="space-y-1">
          <label className="app-form-label" htmlFor={`${testId}-last-name`}>
            {t('lastName')}
            <RequiredMark />
          </label>
          <Input id={`${testId}-last-name`} name="lastName" required placeholder={t('lastPlaceholder')} defaultValue={initialValues?.lastName ?? ''} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="kanaFirstName" placeholder={t('kanaFirstPlaceholder')} aria-label={t('kanaFirstPlaceholder')} defaultValue={initialValues?.kanaFirstName ?? ''} />
        <Input name="kanaLastName" placeholder={t('kanaLastPlaceholder')} aria-label={t('kanaLastPlaceholder')} defaultValue={initialValues?.kanaLastName ?? ''} />
      </div>
      <div className="space-y-1">
        <label className="app-form-label" htmlFor={`${testId}-email`}>
          {t('email')}
          <RequiredMark />
        </label>
        <Input id={`${testId}-email`} type="email" name="email" required placeholder="example@crm.local" defaultValue={initialValues?.email ?? ''} />
      </div>
      <Input name="phone" placeholder={t('phone')} aria-label={t('phone')} defaultValue={initialValues?.phone ?? ''} />
      <Input name="jobTitle" placeholder={t('jobTitle')} aria-label={t('jobTitle')} defaultValue={initialValues?.jobTitle ?? ''} />
      <div className="space-y-1">
        <label className="app-form-label" htmlFor={`${testId}-account`}>
          {t('accountLabel')}
          <RequiredMark />
        </label>
        <Select id={`${testId}-account`} name="accountId" required defaultValue={initialValues?.accountId ?? ''}>
          <option value="" disabled hidden={Boolean(initialValues?.accountId)}>
            {t('accountPlaceholder')}
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </div>
      <Textarea name="notes" rows={3} placeholder={t('notesPlaceholder')} aria-label={t('notesPlaceholder')} defaultValue={initialValues?.notes ?? ''} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full" data-testid={submitTestId ?? `${testId}-submit`}>
        {submitText}
      </Button>
      <SuccessToast trigger={state?.ok ? state : undefined} message={toastText} />
    </form>
  );
}

export function ContactForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  return <ContactFormBase accounts={accounts} action={createContactAction} submitTestId="contact-submit" />;
}

export function ContactEditForm({ contact, accounts }: { contact: Contact; accounts: { id: string; name: string }[] }) {
  const action = updateContactAction.bind(null, contact.id, contact.accountId ?? null);
  const { t } = useI18n('contacts.form');
  return (
    <ContactFormBase
      accounts={accounts}
      action={action}
      initialValues={{
        accountId: contact.accountId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        kanaFirstName: contact.kanaFirstName ?? '',
        kanaLastName: contact.kanaLastName ?? '',
        email: contact.email,
        phone: contact.phone ?? '',
        jobTitle: contact.jobTitle ?? '',
        notes: contact.notes ?? '',
      }}
      submitLabel={t('updateSubmit')}
      toastMessage={t('updateToast')}
      testId="contact-edit-form"
      formKey={contact.id}
      submitTestId="contact-edit-submit"
    />
  );
}
