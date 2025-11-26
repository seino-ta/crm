import Link from 'next/link';

import { OpportunityForm } from './opportunity-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listContacts, listOpportunities, listPipelineStages } from '@/lib/data';
import { formatCurrency, formatDate, formatUserName } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { getPipelineStageLabel } from '@/lib/labels';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function OpportunitiesPage() {
  const { locale, t } = await getServerTranslations('opportunities');
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
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('boardTitle')}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map(({ stage, items }) => (
              <div key={stage.id} className="rounded-2xl border border-slate-100 bg-white p-4 " data-testid="opportunity-stage">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 ">{getPipelineStageLabel(stage.name, locale)}</p>
                  <span className="text-xs app-table-muted">{t('boardCount', { values: { count: items.length.toString() } })}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {items.map((opp) => (
                    <Link key={opp.id} href={`/opportunities/${opp.id}`} className="block rounded-xl bg-white p-3 shadow-sm transition hover:ring-2 hover:ring-blue-200 ">
                      <p className="text-sm font-semibold app-link-accent">{opp.name}</p>
                      <p className="text-xs app-table-muted">
                        {opp.account?.name ?? '—'} ・ {formatCurrency(opp.amount)}
                      </p>
                      <p className="text-xs app-table-muted">
                        {formatUserName(opp.owner?.firstName, opp.owner?.lastName, opp.owner?.email)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('addTitle')}</h2>
          <OpportunityForm
            accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))}
            stages={stages}
            contacts={contactOptions}
            ownerId={user.id}
          />
        </Card>
      </div>
      <Card>
        <h2 className="text-lg font-semibold">{t('tableTitle')}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.name')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.account')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.owner')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.stage')}</th>
                <th className="px-2 py-1 text-right app-table-muted uppercase">{t('table.amount')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.closeDate')}</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.data.map((opp) => (
                <tr key={opp.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-semibold app-link-accent">
                    <a href={`/opportunities/${opp.id}`} data-testid="opportunity-link">
                      {opp.name}
                    </a>
                  </td>
                  <td className="px-2 py-2 app-table-cell">{opp.account?.name ?? '—'}</td>
                  <td className="px-2 py-2 app-table-cell">{formatUserName(opp.owner?.firstName, opp.owner?.lastName, opp.owner?.email)}</td>
                  <td className="px-2 py-2 app-table-cell">{getPipelineStageLabel(opp.stage?.name, locale)}</td>
                  <td className="px-2 py-2 text-right font-mono app-table-cell">{formatCurrency(opp.amount)}</td>
                  <td className="px-2 py-2 app-table-cell">{formatDate(opp.expectedCloseDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
