import { Card } from '@/components/ui/card';
import { PipelineChart } from '@/components/charts/pipeline-chart';
import { OwnerChart } from '@/components/charts/owner-chart';
import { formatCurrency } from '@/lib/formatters';
import { getOwnerReport, getStageReport, listOpportunities, listPipelineStages } from '@/lib/data';

export default async function ReportsPage() {
  const [stageReport, ownerReport, stages, opportunities] = await Promise.all([
    getStageReport(),
    getOwnerReport(),
    listPipelineStages(),
    listOpportunities({ pageSize: 100 }),
  ]);

  const stageMap = new Map(stages.map((stage) => [stage.id, stage] as const));
  const ownerNameMap = new Map<string, string>();
  opportunities.data.forEach((opp) => {
    if (opp.owner) {
      ownerNameMap.set(opp.ownerId, `${opp.owner.firstName ?? ''} ${opp.owner.lastName ?? ''}`.trim() || opp.owner.email);
    }
  });

  const stageRows = stageReport.map((row) => ({
    name: stageMap.get(row.stageId)?.name ?? '未定義',
    amount: Number(row._sum.amount ?? 0),
    deals: row._count._all,
  }));

  const ownerRows = ownerReport.map((row) => ({
    name: ownerNameMap.get(row.ownerId) ?? row.ownerId.slice(0, 6),
    amount: Number(row._sum.amount ?? 0),
    deals: row._count._all,
  }));

  return (
    <div className="space-y-10" data-testid="reports-page">
      <div className="page-header">
        <h1>レポート</h1>
        <p>Playwright でスクリーンショットを取得する対象ページです。</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">ステージ別</h2>
          <PipelineChart data={stageRows.map((row) => ({ stage: row.name, amount: row.amount, deals: row.deals }))} />
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-2 py-1 text-left">ステージ</th>
                <th className="px-2 py-1 text-right">金額</th>
                <th className="px-2 py-1 text-right">件数</th>
              </tr>
            </thead>
            <tbody>
              {stageRows.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="px-2 py-2">{row.name}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(row.amount)}</td>
                  <td className="px-2 py-2 text-right">{row.deals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">担当者別</h2>
          <OwnerChart data={ownerRows.map((row) => ({ owner: row.name, amount: row.amount }))} />
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-2 py-1 text-left">担当者</th>
                <th className="px-2 py-1 text-right">金額</th>
                <th className="px-2 py-1 text-right">件数</th>
              </tr>
            </thead>
            <tbody>
              {ownerRows.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="px-2 py-2">{row.name}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(row.amount)}</td>
                  <td className="px-2 py-2 text-right">{row.deals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
