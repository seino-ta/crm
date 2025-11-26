import { ActivityForm } from './activity-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listActivities, listOpportunities } from '@/lib/data';
import { formatDateTime, formatUserName } from '@/lib/formatters';
import { getActivityTypeLabel } from '@/lib/labels';
import { DeleteActivityButton } from '@/components/activities/delete-activity-button';
import { Card } from '@/components/ui/card';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function ActivitiesPage() {
  const { locale, t } = await getServerTranslations('activities');
  const user = await getCurrentUser();
  const [activities, accounts, opportunities] = await Promise.all([
    listActivities({ pageSize: 20 }),
    listAccounts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
  ]);

  return (
    <div className="space-y-8" data-testid="activities-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('tableTitle')}</h2>
          <div className="mt-4 space-y-4">
            {activities.data.length === 0 && <p className="text-sm text-slate-500">{t('emptyMessage')}</p>}
            {activities.data.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm " data-testid="activity-row">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{activity.subject}</p>
                    <p className="text-xs text-slate-500">
                      {getActivityTypeLabel(activity.type, locale)} ・ {formatDateTime(activity.occurredAt)} ・ {formatUserName(activity.user?.firstName, activity.user?.lastName, activity.user?.email)}
                    </p>
                    {activity.account && <p className="text-xs text-slate-400">{activity.account.name}</p>}
                  </div>
                  <DeleteActivityButton activityId={activity.id} />
                </div>
                {activity.description && <p className="mt-2 text-sm text-slate-600">{activity.description}</p>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('form.submit')}</h2>
          <ActivityForm
            userId={user.id}
            accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))}
            opportunities={opportunities.data.map((opp) => ({ id: opp.id, name: opp.name }))}
          />
        </Card>
      </div>
    </div>
  );
}
