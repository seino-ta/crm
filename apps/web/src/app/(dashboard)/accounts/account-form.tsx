'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getAccountStatusOptions } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';
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
  const pathname = usePathname();
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
        if (successRedirect && successRedirect !== pathname) {
          router.replace(successRedirect);
        } else {
          router.refresh();
        }
      }, 0);
    } else if (state.error) {
      handleErrorCleanup();
    }
  }, [state, router, successRedirect, statusContext, statusValue, pathname, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast]);

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
      <div className="space-y-1">
        <label htmlFor="account-name" className="app-form-label">
          {tForm('nameLabel')}<RequiredMark />
        </label>
        <Input id="account-name" name="name" required defaultValue={initialValues?.name ?? ''} placeholder={tForm('namePlaceholder')} aria-label={tForm('nameLabel')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="domain" defaultValue={initialValues?.domain ?? ''} placeholder={tForm('domainPlaceholder')} aria-label={tForm('domainPlaceholder')} />
        <Input name="website" defaultValue={initialValues?.website ?? ''} placeholder={tForm('websitePlaceholder')} aria-label={tForm('websitePlaceholder')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="industry" defaultValue={initialValues?.industry ?? ''} placeholder={tForm('industryPlaceholder')} aria-label={tAccounts('industryLabel')} />
        <Input name="phone" defaultValue={initialValues?.phone ?? ''} placeholder={tForm('phonePlaceholder')} aria-label={tAccounts('phoneLabel')} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="size" type="number" min={1} defaultValue={initialValues?.size ?? ''} placeholder={tForm('sizePlaceholder')} aria-label={tForm('sizeLabel')} />
        <Input name="annualRevenue" type="number" min={0} defaultValue={initialValues?.annualRevenue ?? ''} placeholder={tForm('revenuePlaceholder')} aria-label={tAccounts('revenueLabel')} />
      </div>
      <div className="space-y-1">
        <label htmlFor="account-status" className="app-form-label">
          {tAccounts('statusLabel')}<RequiredMark />
        </label>
        <Select id="account-status" name="status" value={statusValue} onChange={(event) => setStatusValue(event.target.value as AccountStatus)} aria-label={tAccounts('statusLabel')}>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>
      <Textarea name="description" rows={3} defaultValue={initialValues?.description ?? ''} placeholder={tForm('descriptionPlaceholder')} aria-label={tForm('descriptionPlaceholder')} />
      <SuccessToast trigger={successToastTrigger} message={tToasts('accountSaved')} />
      {state?.error && <p className="text-sm text-rose-600">{tErrors(state.error)}</p>}
      <Button type="submit" className="w-full" data-testid="account-submit">
        {submitLabel ?? tForm('submitCreate')}
      </Button>
    </form>
  );
}
