import Link from 'next/link';

import { AccountForm } from './account-form';
import { createAccountAction } from '@/lib/actions/accounts';
import { listAccounts } from '@/lib/data';
import { formatCurrency } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params?.search === 'string' ? params.search : '';
  const { data } = await listAccounts({ search, pageSize: 50 });

  return (
    <div className="space-y-10" data-testid="accounts-page">
      <div className="page-header">
        <h1>アカウント</h1>
        <p>主要顧客を整理し、担当者単位でアクティビティを追跡します。</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <form className="flex flex-1 items-center gap-2" action="/accounts" method="get">
              <Input name="search" placeholder="キーワード検索" defaultValue={search} />
              <Button type="submit" variant="secondary">
                検索
              </Button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2">名前</th>
                  <th className="px-4 py-2">業界</th>
                  <th className="px-4 py-2">年間売上</th>
                  <th className="px-4 py-2">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {data.map((account) => (
                  <tr key={account.id} className="border-t border-slate-100 text-slate-700 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/${account.id}`} className="font-semibold text-blue-600" data-testid="account-link">
                        {account.name}
                      </Link>
                      <p className="text-xs text-slate-400">{account.domain ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">{account.industry ?? '—'}</td>
                    <td className="px-4 py-3">{formatCurrency(account.annualRevenue)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{account.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">アカウントを追加</h2>
          <p className="mb-4 text-sm text-slate-500">最小限の情報で作成し、詳細は後から更新できます。</p>
          <AccountForm action={createAccountAction} submitLabel="登録" />
        </Card>
      </div>
    </div>
  );
}
