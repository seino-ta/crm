'use client';

import { useActionState } from 'react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const statuses = ['ACTIVE', 'INACTIVE', 'PROSPECT', 'ARCHIVED'];

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
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4" data-testid="account-form">
      <Input name="name" required defaultValue={initialValues?.name ?? ''} placeholder="Acme Inc." aria-label="アカウント名" />
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
      <Select name="status" defaultValue={initialValues?.status ?? 'ACTIVE'} aria-label="ステータス">
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>
      <Textarea name="description" rows={3} defaultValue={initialValues?.description ?? ''} placeholder="概要" aria-label="概要" />
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" className="w-full" data-testid="account-submit">
        {submitLabel}
      </Button>
    </form>
  );
}
