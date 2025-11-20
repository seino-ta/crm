import { Card } from '@/components/ui/card';
import { PipelineChart } from '@/components/charts/pipeline-chart';
import { OwnerChart } from '@/components/charts/owner-chart';
import { formatCurrency, formatDateTime, formatNumber, formatUserName } from '@/lib/formatters';
import {
  getActivityTypeLabel,
  getOpportunityStatusMeta,
  getPipelineStageLabel,
  getTaskStatusMeta,
} from '@/lib/labels';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getOwnerReport,
  getStageReport,
  listActivities,
  listAccounts,
  listOpportunities,
  listPipelineStages,
  listTasks,
} from '@/lib/data';
import { getCurrencyScale } from '@/lib/chart-scale';

export default async function DashboardPage() {
  const [accounts, opportunities, tasks, activities, stageReport, ownerReport, stages] = await Promise.all([
    listAccounts({ pageSize: 8 }),
    listOpportunities({ pageSize: 100 }),
    listTasks({ pageSize: 10 }),
    listActivities({ pageSize: 6 }),
    getStageReport(),
    getOwnerReport(),
    listPipelineStages(),
  ]);

  const stageMap = new Map(stages.map((stage) => [stage.id, getPipelineStageLabel(stage.name)] as const));
  const pipelineChartRaw = stageReport.map((row) => ({
    stage: stageMap.get(row.stageId) ?? '未定義',
    amount: Number(row._sum.amount ?? 0),
    deals: row._count._all,
  }));
  const maxPipelineAmount = pipelineChartRaw.reduce((max, item) => Math.max(max, item.amount), 0);
  const { divisor: amountDivisor, label: amountUnit } = getCurrencyScale(maxPipelineAmount);
  const pipelineChart = pipelineChartRaw.map((item) => ({
    stage: item.stage,
    value: Number((item.amount / amountDivisor).toFixed(2)),
    deals: item.deals,
  }));

  const ownerNameMap = new Map<string, string>();
  opportunities.data.forEach((opp) => {
    if (opp.owner) {
      ownerNameMap.set(opp.ownerId, formatUserName(opp.owner.firstName, opp.owner.lastName, opp.owner.email));
    }
  });
  const ownerChart = ownerReport.map((row) => ({
    owner: ownerNameMap.get(row.ownerId) ?? row.ownerId.slice(0, 6),
    amount: Number(row._sum.amount ?? 0),
  }));

  const openDeals = opportunities.data.filter((opp) => opp.status === 'OPEN').length;
  const pipelineValue = opportunities.data.reduce((acc, opp) => acc + (opp.amount ? Number(opp.amount) : 0), 0);
  const overdueTasks = tasks.data.filter((task) => task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date());

  return (
    <div className="space-y-10" data-testid="dashboard-page">
      <div className="page-header">
        <h1>ダッシュボード</h1>
        <p>重要指標、最新アクティビティ、ボトルネックをひと目で把握します。</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">開いている案件</p>
          <p className="mt-2 text-3xl font-bold">{formatNumber(openDeals)}</p>
          {(() => {
            const { label } = getOpportunityStatusMeta('OPEN');
            return <p className="text-xs text-slate-400">すべてのパイプラインにおける {label} 案件</p>;
          })()}
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">パイプライン総額</p>
          <p className="mt-2 text-3xl font-bold">{formatCurrency(pipelineValue)}</p>
          <p className="text-xs text-slate-400">WON/LOST を除く金額を集計</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">アクティブアカウント</p>
          <p className="mt-2 text-3xl font-bold">{formatNumber(accounts.data.length)}</p>
          <p className="text-xs text-slate-400">最近取得した 8 件を表示中</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">期限超過タスク</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{formatNumber(overdueTasks.length)}</p>
          <p className="text-xs text-slate-400">本日以前に期限を迎えたタスク</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">ステージ別金額</h2>
              <p className="text-sm text-slate-500">ステージ別サマリー</p>
              <p className="text-xs text-slate-400">単位: {amountUnit}</p>
            </div>
            <span className="whitespace-nowrap text-2xl font-bold text-blue-600">
              {formatCurrency(pipelineChartRaw.reduce((acc, item) => acc + item.amount, 0))}
            </span>
          </div>
          <div className="mt-6 min-w-0 overflow-x-auto">
            <PipelineChart data={pipelineChart} unitLabel={amountUnit} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">担当者別パイプライン</h2>
              <p className="text-sm text-slate-500">担当者別サマリー</p>
            </div>
          </div>
          <div className="mt-6">
            <OwnerChart data={ownerChart} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">最新アクティビティ</h2>
              <p className="text-sm text-slate-500">6 件を表示</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {activities.data.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900" data-testid="dashboard-activity">
                <p className="text-sm font-semibold">{activity.subject}</p>
                <p className="text-xs text-slate-500">
                  {getActivityTypeLabel(activity.type)} ・ {formatDateTime(activity.occurredAt)} ・ {formatUserName(activity.user?.firstName, activity.user?.lastName, activity.user?.email)}
                </p>
                {activity.account && <p className="text-xs text-slate-400">{activity.account.name}</p>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">フォーカスタスク</h2>
              <p className="text-sm text-slate-500">直近の 5 件</p>
            </div>
          </div>
          <ul className="mt-4 space-y-4">
            {tasks.data.slice(0, 5).map((task) => (
              <li key={task.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium" data-testid="dashboard-task">
                  {task.title}
                </p>
                {(() => {
                  const { label, tone } = getTaskStatusMeta(task.status);
                  return (
                    <div className="text-xs text-slate-500">
                      <StatusBadge label={label} tone={tone} className="mr-2" />
                      {task.dueDate ? `期限 ${formatDateTime(task.dueDate)}` : '期限未設定'}
                    </div>
                  );
                })()}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
