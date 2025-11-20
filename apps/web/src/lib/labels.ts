import type { AccountStatus, ActivityType, OpportunityStatus, TaskPriority, TaskStatus } from './types';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type Option<T extends string> = { value: T; label: string };

const ACCOUNT_STATUS_OPTIONS_INTERNAL: Option<AccountStatus>[] = [
  { value: 'ACTIVE', label: 'アクティブ' },
  { value: 'PROSPECT', label: '見込み' },
  { value: 'INACTIVE', label: '非アクティブ' },
  { value: 'ARCHIVED', label: 'アーカイブ' },
];

const ACTIVITY_TYPE_OPTIONS_INTERNAL: Option<ActivityType>[] = [
  { value: 'CALL', label: '電話' },
  { value: 'EMAIL', label: 'メール' },
  { value: 'MEETING', label: 'ミーティング' },
  { value: 'NOTE', label: 'メモ' },
  { value: 'OTHER', label: 'その他' },
];

const TASK_PRIORITY_OPTIONS_INTERNAL: Option<TaskPriority>[] = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '至急' },
];

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  OPEN: '未着手',
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
  BLOCKED: 'ブロック中',
  CANCELLED: 'キャンセル',
};

const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  OPEN: '進行中',
  WON: '成約',
  LOST: '失注',
  ARCHIVED: 'アーカイブ',
};

const ACCOUNT_STATUS_TONES: Record<AccountStatus, StatusTone> = {
  ACTIVE: 'success',
  PROSPECT: 'info',
  INACTIVE: 'neutral',
  ARCHIVED: 'warning',
};

const TASK_STATUS_TONES: Record<TaskStatus, StatusTone> = {
  OPEN: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  BLOCKED: 'warning',
  CANCELLED: 'danger',
};

const OPPORTUNITY_STATUS_TONES: Record<OpportunityStatus, StatusTone> = {
  OPEN: 'info',
  WON: 'success',
  LOST: 'danger',
  ARCHIVED: 'warning',
};

const PIPELINE_STAGE_LABELS: Record<string, string> = {
  Prospecting: '見込み発掘',
  Qualified: 'ニーズ確認',
  Proposal: '提案中',
  Negotiation: '交渉中',
  'Closed Won': '成約',
  'Closed Lost': '失注',
};

function buildMap<T extends string>(options: Option<T>[]) {
  return options.reduce<Record<T, string>>((map, option) => {
    map[option.value] = option.label;
    return map;
  }, {} as Record<T, string>);
}

const ACCOUNT_STATUS_LABELS = buildMap(ACCOUNT_STATUS_OPTIONS_INTERNAL);
const ACTIVITY_TYPE_LABELS = buildMap(ACTIVITY_TYPE_OPTIONS_INTERNAL);
const TASK_PRIORITY_LABELS = buildMap(TASK_PRIORITY_OPTIONS_INTERNAL);

function getLabel<T extends string>(map: Record<T, string>, value?: T | null) {
  if (!value) {
    return '—';
  }
  return map[value] ?? value;
}

export const ACCOUNT_STATUS_OPTIONS = ACCOUNT_STATUS_OPTIONS_INTERNAL;
export const ACTIVITY_TYPE_OPTIONS = ACTIVITY_TYPE_OPTIONS_INTERNAL;
export const TASK_PRIORITY_OPTIONS = TASK_PRIORITY_OPTIONS_INTERNAL;

export function getAccountStatusLabel(status?: AccountStatus | null) {
  return getLabel(ACCOUNT_STATUS_LABELS, status);
}

export function getAccountStatusMeta(status?: AccountStatus | null) {
  const label = getAccountStatusLabel(status);
  const tone = status ? ACCOUNT_STATUS_TONES[status] ?? 'neutral' : 'neutral';
  return { label, tone };
}

export function getActivityTypeLabel(type?: ActivityType | null) {
  return getLabel(ACTIVITY_TYPE_LABELS, type);
}

export function getTaskPriorityLabel(priority?: TaskPriority | null) {
  return getLabel(TASK_PRIORITY_LABELS, priority);
}

export function getTaskStatusLabel(status?: TaskStatus | null) {
  return getLabel(TASK_STATUS_LABELS, status);
}

export function getTaskStatusMeta(status?: TaskStatus | null) {
  const label = getTaskStatusLabel(status);
  const tone = status ? TASK_STATUS_TONES[status] ?? 'neutral' : 'neutral';
  return { label, tone };
}

export function getOpportunityStatusLabel(status?: OpportunityStatus | null) {
  return getLabel(OPPORTUNITY_STATUS_LABELS, status);
}

export function getOpportunityStatusMeta(status?: OpportunityStatus | null) {
  const label = getOpportunityStatusLabel(status);
  const tone = status ? OPPORTUNITY_STATUS_TONES[status] ?? 'neutral' : 'neutral';
  return { label, tone };
}

export function getPipelineStageLabel(name?: string | null) {
  if (!name) return '—';
  return PIPELINE_STAGE_LABELS[name] ?? name;
}
