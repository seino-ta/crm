'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ACCOUNT_STATUS_OPTIONS } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';

type AccountFormProps = {
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  submitLabel: string;
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

export function AccountForm({ action, submitLabel, initialValues }: AccountFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<{ ok?: boolean; error?: string } | undefined, FormData>(action, undefined);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" data-testid="account-form">
      <div className="space-y-1">
        <label htmlFor="account-name" className="text-sm font-medium text-slate-600">
          アカウント名<RequiredMark />
        </label>
        <Input id="account-name" name="name" required defaultValue={initialValues?.name ?? ''} placeholder="Acme Inc." aria-label="アカウント名" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="domain" defaultValue={initialValues?.domain ?? ''} placeholder="https://acme.com" aria-label="ドメイン" />
        <Input name="website" defaultValue={initialValues?.website ?? ''} placeholder="https://acme.com" aria-label="ウェブサイト" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="industry" defaultValue={initialValues?.industry ?? ''} placeholder="SaaS" aria-label="業界" />
        <Input name="phone" defaultValue={initialValues?.phone ?? ''} placeholder="000-0000-0000" aria-label="電話番号" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="size" type="number" min={1} defaultValue={initialValues?.size ?? ''} placeholder="従業員数" aria-label="規模" />
        <Input name="annualRevenue" type="number" min={0} defaultValue={initialValues?.annualRevenue ?? ''} placeholder="年間売上" aria-label="年間売上" />
      </div>
      <div className="space-y-1">
        <label htmlFor="account-status" className="text-sm font-medium text-slate-600">
          ステータス<RequiredMark />
        </label>
        <Select id="account-status" name="status" defaultValue={initialValues?.status ?? 'ACTIVE'} aria-label="ステータス">
          {ACCOUNT_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>
      <Textarea name="description" rows={3} defaultValue={initialValues?.description ?? ''} placeholder="概要" aria-label="概要" />
      {showModal && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          アカウントを保存しました。
        </div>
      )}
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" className="w-full" data-testid="account-submit">
        {submitLabel}
      </Button>
    </form>
  );
}
