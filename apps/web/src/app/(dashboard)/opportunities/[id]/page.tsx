import { notFound } from 'next/navigation';
import Link from 'next/link';

import { listActivities, listPipelineStages, listTasks, getOpportunity } from '@/lib/data';
import { formatCurrency, formatDate, formatDateTime, formatUserName } from '@/lib/formatters';
import { updateOpportunityStageAction } from '@/lib/actions/opportunities';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { StageUpdateForm } from './stage-update-form';
import {
  getActivityTypeLabel,
  getOpportunityStatusMeta,
  getPipelineStageLabel,
  getTaskStatusMeta,
} from '@/lib/labels';

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = await getOpportunity(id).catch(() => null);
  if (!opportunity) notFound();
  const [stages, activities, tasks] = await Promise.all([
    listPipelineStages(),
    listActivities({ opportunityId: id, pageSize: 10 }),
    listTasks({ opportunityId: id, pageSize: 10 }),
  ]);

  return (
    <div className="space-y-8" data-testid="opportunity-detail-page">
      <div className="page-header">
        <h1>{opportunity.name}</h1>
        <p>{opportunity.account?.name ?? 'アカウント未設定'} ・ {getPipelineStageLabel(opportunity.stage?.name)}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">金額</p>
              <p className="text-3xl font-bold">{formatCurrency(opportunity.amount)}</p>
              <p className="text-sm text-slate-500">
                予測確度 {opportunity.probability ?? 0}% ・ 予定日 {formatDate(opportunity.expectedCloseDate)}
              </p>
            </div>
            <StageUpdateForm
              action={updateOpportunityStageAction.bind(null, opportunity.id)}
              stages={stages.map((stage) => ({ ...stage, name: getPipelineStageLabel(stage.name) }))}
              defaultStageId={opportunity.stageId}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">担当者</p>
              <p className="text-base">{formatUserName(opportunity.owner?.firstName, opportunity.owner?.lastName, opportunity.owner?.email)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">コンタクト</p>
              <p className="text-base">{opportunity.contact ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">ステータス</p>
              {(() => {
                const { label, tone } = getOpportunityStatusMeta(opportunity.status);
                return <StatusBadge label={label} tone={tone} />;
              })()}
            </div>
            <div>
              <p className="text-xs text-slate-500">最終更新</p>
              <p className="text-base">{formatDateTime(opportunity.updatedAt)}</p>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs text-slate-500">説明</p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{opportunity.description ?? '—'}</p>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">関連リンク</h2>
          <div className="mt-4 space-y-2 text-sm">
            {opportunity.account && (
              <Link href={`/accounts/${opportunity.accountId}`} className="text-blue-600">
                アカウントを開く
              </Link>
            )}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-500">タスク</h3>
            <ul className="mt-2 space-y-2">
              {tasks.data.map((task) => (
                <li key={task.id} className="rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800">
                  <p className="font-medium">{task.title}</p>
                  {(() => {
                    const { label, tone } = getTaskStatusMeta(task.status);
                    return (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <StatusBadge label={label} tone={tone} />
                        <span>{task.dueDate ? formatDateTime(task.dueDate) : '期限未設定'}</span>
                      </div>
                    );
                  })()}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="text-lg font-semibold">活動ログ</h2>
        <div className="mt-4 space-y-3">
          {activities.data.map((activity) => (
            <div key={activity.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold">{activity.subject}</p>
              <p className="text-xs text-slate-500">
                {getActivityTypeLabel(activity.type)} ・ {formatDateTime(activity.occurredAt)} ・ {formatUserName(activity.user?.firstName, activity.user?.lastName, activity.user?.email)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
