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
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardPage() {
  const { locale, t } = await getServerTranslations('dashboard');
  const [accounts, opportunities, tasks, activities, stageReport, ownerReport, stages] = await Promise.all([
    listAccounts({ pageSize: 8 }),
    listOpportunities({ pageSize: 100 }),
    listTasks({ pageSize: 10 }),
    listActivities({ pageSize: 6 }),
    getStageReport(),
    getOwnerReport(),
    listPipelineStages(),
  ]);

  const stageMap = new Map(stages.map((stage) => [stage.id, getPipelineStageLabel(stage.name, locale)] as const));
  const pipelineChartRaw = stageReport.map((row) => ({
    stage: stageMap.get(row.stageId) ?? t('sections.stageUnknown'),
    amount: Number(row._sum.amount ?? 0),
    deals: row._count._all,
  }));
  const maxPipelineAmount = pipelineChartRaw.reduce((max, item) => Math.max(max, item.amount), 0);
  const { divisor: amountDivisor, label: amountUnit } = getCurrencyScale(maxPipelineAmount, locale);
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
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500 ">{t('metrics.openDealsLabel')}</p>
          <p className="mt-2 text-3xl font-bold">{formatNumber(openDeals, locale)}</p>
          {(() => {
            const { label } = getOpportunityStatusMeta('OPEN', locale);
            return (
              <p className="text-xs text-slate-400 ">
                {t('metrics.openDealsDescription', { values: { status: label } })}
              </p>
            );
          })()}
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500 ">{t('metrics.pipelineValueLabel')}</p>
          <p className="mt-2 text-3xl font-bold">{formatCurrency(pipelineValue, 'JPY', locale)}</p>
          <p className="text-xs text-slate-400 ">{t('metrics.pipelineValueDescription')}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500 ">{t('metrics.activeAccountsLabel')}</p>
          <p className="mt-2 text-3xl font-bold">{formatNumber(accounts.data.length, locale)}</p>
          <p className="text-xs text-slate-400 ">{t('metrics.activeAccountsDescription')}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500 ">{t('metrics.overdueTasksLabel')}</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{formatNumber(overdueTasks.length, locale)}</p>
          <p className="text-xs text-slate-400 ">{t('metrics.overdueTasksDescription')}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{t('sections.stageTitle')}</h2>
              <p className="text-sm text-slate-500 ">{t('sections.stageSubtitle')}</p>
              <p className="text-xs text-slate-400 ">
                {t('sections.stageUnit')}: {amountUnit}
              </p>
            </div>
            <span className="whitespace-nowrap text-2xl font-bold text-blue-600 ">
              {formatCurrency(pipelineChartRaw.reduce((acc, item) => acc + item.amount, 0), 'JPY', locale)}
            </span>
          </div>
          <div className="mt-6 min-w-0 overflow-x-auto">
            <PipelineChart data={pipelineChart} unitLabel={amountUnit} locale={locale} valueLabel={t('sections.stageValueLabel')} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('sections.ownerTitle')}</h2>
              <p className="text-sm text-slate-500 ">{t('sections.ownerSubtitle')}</p>
            </div>
          </div>
          <div className="mt-6">
            <OwnerChart data={ownerChart} locale={locale} unitHeader={t('sections.ownerUnitLabel')} axisLabel={t('sections.ownerValueLabel')} tooltipLabel={t('sections.ownerValueLabel')} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('sections.recentActivitiesTitle')}</h2>
              <p className="text-sm text-slate-500 ">{t('sections.recentActivitiesSubtitle')}</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {activities.data.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-100 bg-white p-4 " data-testid="dashboard-activity">
                <p className="text-sm font-semibold">{activity.subject}</p>
                <p className="text-xs text-slate-500">
                  {getActivityTypeLabel(activity.type, locale)} ・ {formatDateTime(activity.occurredAt)} ・ {formatUserName(activity.user?.firstName, activity.user?.lastName, activity.user?.email)}
                </p>
                {activity.account && <p className="text-xs text-slate-400">{activity.account.name}</p>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('sections.focusTasksTitle')}</h2>
              <p className="text-sm text-slate-500 ">{t('sections.focusTasksSubtitle')}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-4">
            {tasks.data.slice(0, 5).map((task) => (
              <li key={task.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm ">
                <p className="font-medium" data-testid="dashboard-task">
                  {task.title}
                </p>
                {(() => {
                  const { label, tone } = getTaskStatusMeta(task.status, locale);
                  return (
                    <div className="text-xs text-slate-500">
                      <StatusBadge label={label} tone={tone} className="mr-2" />
                      {task.dueDate
                        ? t('sections.duePrefix', { values: { date: formatDateTime(task.dueDate) } })
                        : t('sections.noDue')}
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
