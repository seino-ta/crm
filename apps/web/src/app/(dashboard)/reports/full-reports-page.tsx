import { Card } from '@/components/ui/card';
import { PipelineChart } from '@/components/charts/pipeline-chart';
import { OwnerChart } from '@/components/charts/owner-chart';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { getOwnerReport, getStageReport, listOpportunities, listPipelineStages } from '@/lib/data';
import { getCurrencyScale } from '@/lib/chart-scale';
import { getPipelineStageLabel } from '@/lib/labels';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function ReportsPage() {
  const { locale, t } = await getServerTranslations('reports');
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

  const stageRows = stageReport.map((row) => {
    const stage = stageMap.get(row.stageId);
    const label = getPipelineStageLabel(stage?.name, locale);
    return {
      id: row.stageId,
      name: label,
      amount: Number(row._sum.amount ?? 0),
      deals: row._count._all,
    };
  });

  const ownerRows = ownerReport.map((row) => ({
    name: ownerNameMap.get(row.ownerId) ?? row.ownerId.slice(0, 6),
      amount: Number(row._sum.amount ?? 0),
      deals: row._count._all,
  }));

  const maxStageAmount = stageRows.reduce((max, row) => Math.max(max, row.amount), 0);
  const { divisor: stageDivisor, label: stageUnit } = getCurrencyScale(maxStageAmount, locale);
  const stageChart = stageRows.map((row) => ({
    stage: row.name,
    value: Number((row.amount / stageDivisor).toFixed(2)),
    deals: row.deals,
  }));

  return (
    <div className="space-y-10" data-testid="reports-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">{t('stage')}</h2>
          <p className="text-xs text-slate-400 ">
            {t('unit')}: {stageUnit}
          </p>
          <PipelineChart data={stageChart} unitLabel={stageUnit} locale={locale} valueLabel={t('table.amount')} />
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500 ">
                <th className="px-2 py-1 text-left">{t('table.stage')}</th>
                <th className="px-2 py-1 text-right">{t('table.amount')}</th>
                <th className="px-2 py-1 text-right">{t('table.deals')}</th>
              </tr>
            </thead>
            <tbody>
              {stageRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">{row.name}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(row.amount, 'JPY', locale)}</td>
                  <td className="px-2 py-2 text-right">{formatNumber(row.deals, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('owner')}</h2>
          <OwnerChart
            data={ownerRows.map((row) => ({ owner: row.name, amount: row.amount }))}
            locale={locale}
            unitHeader={t('charts.unitHeader')}
            axisLabel={t('charts.axisLabel')}
            tooltipLabel={t('table.amount')}
          />
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500 ">
                <th className="px-2 py-1 text-left">{t('table.owner')}</th>
                <th className="px-2 py-1 text-right">{t('table.amount')}</th>
                <th className="px-2 py-1 text-right">{t('table.deals')}</th>
              </tr>
            </thead>
            <tbody>
              {ownerRows.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="px-2 py-2">{row.name}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(row.amount, 'JPY', locale)}</td>
                  <td className="px-2 py-2 text-right">{formatNumber(row.deals, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
