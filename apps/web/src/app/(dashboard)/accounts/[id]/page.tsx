import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AccountForm } from '../account-form';
import { updateAccountAction } from '@/lib/actions/accounts';
import { getAccount, listActivities, listOpportunities, listTasks } from '@/lib/data';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteAccountButton } from '@/components/accounts/delete-account-button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getAccountStatusMeta,
  getActivityTypeLabel,
  getPipelineStageLabel,
  getTaskStatusMeta,
} from '@/lib/labels';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccount(id).catch(() => null);
  if (!account) {
    notFound();
  }
  const [opportunities, tasks, activities] = await Promise.all([
    listOpportunities({ accountId: id, pageSize: 20 }),
    listTasks({ accountId: id, pageSize: 10 }),
    listActivities({ accountId: id, pageSize: 10 }),
  ]);

  return (
    <div className="space-y-8" data-testid="account-detail-page">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">アカウント</p>
        <h1 className="text-3xl font-bold">{account.name}</h1>
        <p className="text-sm text-slate-500">{account.industry ?? '—'} ・ {account.domain ?? 'ドメイン未設定'}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">基本情報</h2>
            <DeleteAccountButton accountId={account.id} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">業界</p>
              <p className="text-base">{account.industry ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">年間売上</p>
              <p className="text-base">{formatCurrency(account.annualRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">電話番号</p>
              <p className="text-base">{account.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">ステータス</p>
              {(() => {
                const { label, tone } = getAccountStatusMeta(account.status);
                return <StatusBadge label={label} tone={tone} />;
              })()}
            </div>
          </div>
          <div className="mt-6">
            <AccountForm
              action={updateAccountAction.bind(null, account.id)}
              submitLabel="更新"
              initialValues={{
                name: account.name,
                domain: account.domain,
                industry: account.industry,
                website: account.website,
                size: account.size,
                description: account.description,
                annualRevenue: account.annualRevenue,
                phone: account.phone,
                status: account.status,
              }}
            />
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">最新活動</h2>
          <div className="mt-4 space-y-3">
            {activities.data.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-medium">{activity.subject}</p>
                <p className="text-xs text-slate-500">{getActivityTypeLabel(activity.type)} ・ {formatDateTime(activity.occurredAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">紐付く案件</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-2 py-1 text-left">案件名</th>
                <th className="px-2 py-1 text-left">ステージ</th>
                <th className="px-2 py-1 text-right">金額</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.data.map((opp) => (
                <tr key={opp.id} className="border-t border-slate-100"
                >
                  <td className="px-2 py-2">
                    <Link href={`/opportunities/${opp.id}`} className="text-blue-600">{opp.name}</Link>
                  </td>
                  <td className="px-2 py-2">{getPipelineStageLabel(opp.stage?.name)}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(opp.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">タスク</h2>
          <div className="mt-4 space-y-3">
            {tasks.data.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800" data-testid="account-task">
                <p className="text-sm font-medium">{task.title}</p>
                {(() => {
                  const { label, tone } = getTaskStatusMeta(task.status);
                  return (
                    <p className="text-xs text-slate-500">
                      <StatusBadge label={label} tone={tone} className="mr-2" />
                      {task.dueDate ? formatDateTime(task.dueDate) : '期限未設定'}
                    </p>
                  );
                })()}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
