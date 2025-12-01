import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { AccountForm } from '../account-form';
import { updateAccountAction } from '@/lib/actions/accounts';
import { getAccount, listActivities, listContacts, listOpportunities, listTasks } from '@/lib/data';
import { formatCurrency, formatDateTime, formatUserName } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { DeleteAccountButton } from '@/components/accounts/delete-account-button';
import { RestoreAccountButton } from '@/components/accounts/restore-account-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createTranslator } from '@/lib/i18n/translator';
import { getServerTranslations } from '@/lib/i18n/server';
import { getActivityTypeLabel, getPipelineStageLabel, getTaskStatusMeta } from '@/lib/labels';
import { AccountStatusProvider } from '@/components/accounts/account-status-context';
import { AccountStatusBadge } from '@/components/accounts/account-status-badge';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccount(id).catch(() => null);
  if (!account) {
    notFound();
  }
  const isArchived = Boolean(account.deletedAt);
  const { locale, messages, t } = await getServerTranslations('accounts');
  const tDetail = createTranslator(messages, 'accounts.detail');
  const tTable = createTranslator(messages, 'accounts.table');
  const tForm = createTranslator(messages, 'accounts.form');
  const [opportunities, tasks, activities, contacts] = await Promise.all([
    listOpportunities({ accountId: id, pageSize: 20 }),
    listTasks({ accountId: id, pageSize: 10 }),
    listActivities({ accountId: id, pageSize: 10 }),
    listContacts({ accountId: id, pageSize: 20 }),
  ]);

  return (
    <div className="space-y-8" data-testid="account-detail-page">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">{tDetail('sectionLabel', 'Account')}</p>
        <h1 className="text-3xl font-bold">{account.name}</h1>
        <p className="text-sm text-slate-500">{account.industry ?? '—'} ・ {account.domain ?? tDetail('domainUnset')}</p>
        {isArchived && (
          <div className="rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-800">{tDetail('archivedNotice')}</div>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('baseInfoTitle')}</h2>
            {isArchived ? <RestoreAccountButton accountId={account.id} /> : <DeleteAccountButton accountId={account.id} />}
          </div>
          <AccountStatusProvider initialStatus={account.status}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">{t('industryLabel')}</p>
                <p className="text-base">{account.industry ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('revenueLabel')}</p>
                <p className="text-base">{formatCurrency(account.annualRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('phoneLabel')}</p>
                <p className="text-base">{account.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('statusLabel')}</p>
                <AccountStatusBadge locale={locale} />
              </div>
            </div>
            {!isArchived && (
              <div className="mt-6">
                <AccountForm
                  action={updateAccountAction.bind(null, account.id)}
                  submitLabel={tForm('submitUpdate')}
                  successRedirect={`/accounts/${account.id}`}
                  formKey={account.id}
                  matchSnapshot={false}
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
            )}
          </AccountStatusProvider>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{tDetail('latestActivities')}</h2>
          <div className="mt-4 space-y-3">
            {activities.data.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-100 bg-white p-3 ">
                <p className="text-sm font-medium">{activity.subject}</p>
                <p className="text-xs text-slate-500">
                  {tDetail('activityMeta', {
                    values: {
                      type: getActivityTypeLabel(activity.type, locale),
                      datetime: formatDateTime(activity.occurredAt),
                      owner: formatUserName(activity.user?.firstName, activity.user?.lastName, activity.user?.email),
                    },
                  })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">{t('relatedDealsTitle')}</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-2 py-1 text-left">{tTable('name')}</th>
                <th className="px-2 py-1 text-left">{tDetail('stageHeader')}</th>
                <th className="px-2 py-1 text-right">{tDetail('amountHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.data.map((opp) => (
                <tr key={opp.id} className="border-t border-slate-100"
                >
                  <td className="px-2 py-2">
                    <Link href={`/opportunities/${opp.id}`} className="text-blue-600">{opp.name}</Link>
                  </td>
                  <td className="px-2 py-2">{getPipelineStageLabel(opp.stage?.name, locale)}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(opp.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('tasksTitle')}</h2>
          <div className="mt-4 space-y-3">
            {tasks.data.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-100 p-3 " data-testid="account-task">
                <p className="text-sm font-medium">{task.title}</p>
                {(() => {
                  const { label, tone } = getTaskStatusMeta(task.status, locale);
                  return (
                    <p className="text-xs text-slate-500">
                      <StatusBadge label={label} tone={tone} className="mr-2" />
                      {task.dueDate
                        ? tDetail('taskDuePrefix', { values: { date: formatDateTime(task.dueDate) } })
                        : tDetail('taskNoDue')}
                    </p>
                  );
                })()}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card data-testid="account-contacts-section">
        <h2 className="text-lg font-semibold">{tDetail('contactsTitle')}</h2>
        {contacts.data.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500" data-testid="account-contacts-empty">
            {tDetail('contactsEmpty')}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {contacts.data.map((contact) => (
              <div key={contact.id} className="rounded-xl border border-slate-100 bg-white p-3" data-testid="account-contact-row">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{`${contact.lastName} ${contact.firstName}`}</p>
                  <Link href={`/contacts/${contact.id}/edit`} className="text-xs text-blue-600 hover:underline">
                    {tDetail('contactsEdit')}
                  </Link>
                </div>
                <p className="text-xs text-slate-500">{contact.jobTitle ?? tDetail('contactsJobFallback')}</p>
                <div className="mt-1 text-xs text-blue-600">
                  <a href={`mailto:${contact.email}`} className="hover:underline">
                    {contact.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            {tDetail('contactsCount', {
              values: { count: (contacts.meta?.total ?? contacts.data.length).toString() },
            })}
          </span>
          <Link href="/contacts" className="text-blue-600 hover:underline">
            {tDetail('contactsViewAll')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
