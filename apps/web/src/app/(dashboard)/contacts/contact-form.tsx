'use client';

import { useActionState } from 'react';

import { createContactAction, updateContactAction, type ContactActionState } from '@/lib/actions/contacts';
import { FloatingInput, FloatingSelect, FloatingTextarea } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
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
        <FloatingInput
          id={`${testId}-first-name`}
          name="firstName"
          label={t('firstName')}
          example={t('firstPlaceholder')}
          required
          defaultValue={initialValues?.firstName ?? ''}
        />
        <FloatingInput
          id={`${testId}-last-name`}
          name="lastName"
          label={t('lastName')}
          example={t('lastPlaceholder')}
          required
          defaultValue={initialValues?.lastName ?? ''}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FloatingInput name="kanaFirstName" label={t('kanaFirstPlaceholder')} example={t('kanaFirstPlaceholder')} defaultValue={initialValues?.kanaFirstName ?? ''} />
        <FloatingInput name="kanaLastName" label={t('kanaLastPlaceholder')} example={t('kanaLastPlaceholder')} defaultValue={initialValues?.kanaLastName ?? ''} />
      </div>
      <FloatingInput
        id={`${testId}-email`}
        type="email"
        name="email"
        label={t('email')}
        example="user@example.com"
        required
        defaultValue={initialValues?.email ?? ''}
      />
      <FloatingInput name="phone" label={t('phone')} example="090-1234-5678" defaultValue={initialValues?.phone ?? ''} />
      <FloatingInput name="jobTitle" label={t('jobTitle')} example={t('jobTitle')} defaultValue={initialValues?.jobTitle ?? ''} />
      <FloatingSelect
        id={`${testId}-account`}
        name="accountId"
        label={t('accountLabel')}
        required
        defaultValue={initialValues?.accountId ?? ''}
        forceFloatLabel
      >
        <option value="" disabled>
          {t('accountPlaceholder')}
        </option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </FloatingSelect>
      <FloatingTextarea
        name="notes"
        label={t('notesPlaceholder')}
        example={t('notesPlaceholder')}
        rows={3}
        defaultValue={initialValues?.notes ?? ''}
      />
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
