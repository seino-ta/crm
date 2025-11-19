import { OpportunityForm } from './opportunity-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listContacts, listOpportunities, listPipelineStages } from '@/lib/data';
import { formatCurrency, formatDate, formatUserName } from '@/lib/formatters';
import { Card } from '@/components/ui/card';

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();
  const [opportunities, accounts, stages, contacts] = await Promise.all([
    listOpportunities({ pageSize: 100 }),
    listAccounts({ pageSize: 100 }),
    listPipelineStages(),
    listContacts({ pageSize: 100 }),
  ]);

  const contactOptions = contacts.map((contact) => ({ id: contact.id, name: `${contact.firstName} ${contact.lastName}` }));
  const grouped = stages.map((stage) => ({
    stage,
    items: opportunities.data.filter((opp) => opp.stageId === stage.id),
  }));

  return (
    <div className="space-y-10" data-testid="opportunities-page">
      <div className="page-header">
        <h1>案件</h1>
        <p>ステージごとの進捗と主要 KPI を一元管理します。</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <h2 className="text-lg font-semibold">パイプライン</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map(({ stage, items }) => (
              <div key={stage.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900" data-testid="opportunity-stage">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{stage.name}</p>
                  <span className="text-xs text-slate-500">{items.length} 件</span>
                </div>
                <div className="mt-3 space-y-3">
                  {items.map((opp) => (
                    <div key={opp.id} className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-950">
                      <p className="text-sm font-semibold text-blue-600">{opp.name}</p>
                      <p className="text-xs text-slate-500">
                        {opp.account?.name ?? '未設定'} ・ {formatCurrency(opp.amount)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatUserName(opp.owner?.firstName, opp.owner?.lastName, opp.owner?.email)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">案件を追加</h2>
          <OpportunityForm
            accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))}
            stages={stages.map((stage) => ({ id: stage.id, name: stage.name }))}
            contacts={contactOptions}
            ownerId={user.id}
          />
        </Card>
      </div>
      <Card>
        <h2 className="text-lg font-semibold">案件一覧</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-2 py-1 text-left">案件名</th>
                <th className="px-2 py-1 text-left">アカウント</th>
                <th className="px-2 py-1 text-left">オーナー</th>
                <th className="px-2 py-1 text-left">ステージ</th>
                <th className="px-2 py-1 text-right">金額</th>
                <th className="px-2 py-1 text-left">予定日</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.data.map((opp) => (
                <tr key={opp.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-semibold text-blue-600">
                    <a href={`/opportunities/${opp.id}`} data-testid="opportunity-link">
                      {opp.name}
                    </a>
                  </td>
                  <td className="px-2 py-2">{opp.account?.name ?? '—'}</td>
                  <td className="px-2 py-2">{formatUserName(opp.owner?.firstName, opp.owner?.lastName, opp.owner?.email)}</td>
                  <td className="px-2 py-2">{opp.stage?.name ?? '—'}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(opp.amount)}</td>
                  <td className="px-2 py-2">{formatDate(opp.expectedCloseDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
