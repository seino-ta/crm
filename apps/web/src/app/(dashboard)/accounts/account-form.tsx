'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FloatingInput, FloatingSelect, FloatingTextarea } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { getAccountStatusOptions } from '@/lib/labels';
import { SuccessToast } from '@/components/ui/success-modal';
import { useI18n } from '@/components/providers/i18n-provider';
import type { AccountActionState } from '@/lib/actions/accounts';
import type { AccountStatus } from '@/lib/types';
import { useAccountStatus } from '@/components/accounts/account-status-context';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';

type AccountFormProps = {
  action: (state: AccountActionState | undefined, formData: FormData) => Promise<AccountActionState | void>;
  submitLabel: string;
  successRedirect?: string;
  formKey: string;
  matchSnapshot?: boolean;
  initialValues?: Partial<{
    name: string;
    domain: string | null;
    industry: string | null;
    website: string | null;
    size: number | null;
    description: string | null;
    annualRevenue: string | null;
    phone: string | null;
    status: string;
  }>;
};

type AccountFormSnapshot = {
  name: string;
  domain: string;
  industry: string;
  website: string;
  size: string;
  description: string;
  annualRevenue: string;
  phone: string;
  status: string;
};

function normalizeInitialValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (typeof (value as { toString?: () => string }).toString === 'function') {
      const stringified = (value as { toString: () => string }).toString();
      if (stringified && stringified !== '[object Object]') {
        return stringified;
      }
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function normalizeFormValue(value: FormDataEntryValue | null) {
  if (value === null) return '';
  return typeof value === 'string' ? value : String(value);
}

function snapshotFromInitialValues(values?: AccountFormProps['initialValues']): AccountFormSnapshot {
  return {
    name: normalizeInitialValue(values?.name),
    domain: normalizeInitialValue(values?.domain ?? undefined),
    industry: normalizeInitialValue(values?.industry ?? undefined),
    website: normalizeInitialValue(values?.website ?? undefined),
    size: normalizeInitialValue(values?.size ?? undefined),
    description: normalizeInitialValue(values?.description ?? undefined),
    annualRevenue: normalizeInitialValue(values?.annualRevenue ?? undefined),
    phone: normalizeInitialValue(values?.phone ?? undefined),
    status: normalizeInitialValue(values?.status ?? undefined),
  };
}

function snapshotFromFormData(formData: FormData): AccountFormSnapshot {
  return {
    name: normalizeFormValue(formData.get('name')),
    domain: normalizeFormValue(formData.get('domain')),
    industry: normalizeFormValue(formData.get('industry')),
    website: normalizeFormValue(formData.get('website')),
    size: normalizeFormValue(formData.get('size')),
    description: normalizeFormValue(formData.get('description')),
    annualRevenue: normalizeFormValue(formData.get('annualRevenue')),
    phone: normalizeFormValue(formData.get('phone')),
    status: normalizeFormValue(formData.get('status')),
  };
}

export function AccountForm({ action, submitLabel, initialValues, successRedirect, formKey, matchSnapshot }: AccountFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<AccountActionState | undefined, FormData>(action, undefined);
  const { t: tToasts } = useI18n('toasts');
  const { t: tAccounts, locale } = useI18n('accounts');
  const { t: tForm } = useI18n('accounts.form');
  const { t: tErrors } = useI18n('accounts.errors');
  const statusOptions = useMemo(() => getAccountStatusOptions(locale, { includeArchived: false }), [locale]);
  const statusContext = useAccountStatus();
  const [statusValue, setStatusValue] = useState<AccountStatus>((initialValues?.status as AccountStatus) ?? 'ACTIVE');
  useEffect(() => {
    setStatusValue((initialValues?.status as AccountStatus) ?? 'ACTIVE');
  }, [initialValues?.status]);
  const initialSnapshotSignature = useMemo(() => JSON.stringify(snapshotFromInitialValues(initialValues)), [initialValues]);
  const shouldMatchSnapshot = matchSnapshot ?? Boolean(initialValues);
  const { toastTrigger, handleSubmitSnapshot, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast } = useFormSuccessToast({
    formId: `accounts:${formKey}`,
    initialSnapshot: initialSnapshotSignature,
    matchInitialSnapshot: shouldMatchSnapshot,
    message: tToasts('accountSaved'),
  });
  const lastHandledStateRef = useRef<AccountActionState | undefined>();
  const successToastTrigger = toastTrigger ?? undefined;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (lastHandledStateRef.current === state) return;
      lastHandledStateRef.current = state;
      triggerImmediateToast();
      handleSuccessPersist();
      statusContext?.setStatus(statusValue);
      setTimeout(() => {
        router.refresh();
      }, 0);
    } else if (state.error) {
      handleErrorCleanup();
    }
  }, [state, router, successRedirect, statusContext, statusValue, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      data-testid="account-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(snapshotFromFormData(new FormData(event.currentTarget)));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <FloatingInput
        id="account-name"
        name="name"
        label={tForm('nameLabel')}
        example={tForm('namePlaceholder')}
        required
        defaultValue={initialValues?.name ?? ''}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput name="domain" label={tForm('domainLabel')} example={tForm('domainPlaceholder')} defaultValue={initialValues?.domain ?? ''} />
        <FloatingInput name="website" label={tForm('websiteLabel')} example={tForm('websitePlaceholder')} defaultValue={initialValues?.website ?? ''} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput name="industry" label={tAccounts('industryLabel')} example={tForm('industryPlaceholder')} defaultValue={initialValues?.industry ?? ''} />
        <FloatingInput name="phone" label={tAccounts('phoneLabel')} example={tForm('phonePlaceholder')} defaultValue={initialValues?.phone ?? ''} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput
          name="size"
          type="number"
          min={1}
          label={tForm('sizeLabel')}
          example={tForm('sizePlaceholder')}
          defaultValue={initialValues?.size ?? ''}
        />
        <FloatingInput
          name="annualRevenue"
          type="number"
          min={0}
          label={tAccounts('revenueLabel')}
          example={tForm('revenuePlaceholder')}
          defaultValue={initialValues?.annualRevenue ?? ''}
        />
      </div>
      <FloatingSelect
        id="account-status"
        name="status"
        label={tAccounts('statusLabel')}
        value={statusValue}
        onChange={(event) => setStatusValue(event.target.value as AccountStatus)}
        required
      >
        {statusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </FloatingSelect>
      <FloatingTextarea
        name="description"
        rows={3}
        label={tForm('descriptionLabel')}
        example={tForm('descriptionPlaceholder')}
        defaultValue={initialValues?.description ?? ''}
      />
      <SuccessToast trigger={successToastTrigger} message={tToasts('accountSaved')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full" data-testid="account-submit">
        {submitLabel ?? tForm('submitCreate')}
      </Button>
    </form>
  );
}
