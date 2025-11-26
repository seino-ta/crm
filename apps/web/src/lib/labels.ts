import type { AccountStatus, ActivityType, OpportunityStatus, TaskPriority, TaskStatus } from './types';
import type { Locale } from '@/lib/i18n/config';
import { defaultLocale } from '@/lib/i18n/config';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type Option<T extends string> = { value: T; label: Record<Locale, string> };

const ACCOUNT_STATUS_OPTIONS_INTERNAL: Option<AccountStatus>[] = [
  { value: 'ACTIVE', label: { ja: 'アクティブ', en: 'Active' } },
  { value: 'PROSPECT', label: { ja: '見込み', en: 'Prospect' } },
  { value: 'INACTIVE', label: { ja: '非アクティブ', en: 'Inactive' } },
  { value: 'ARCHIVED', label: { ja: 'アーカイブ', en: 'Archived' } },
];

const ACTIVITY_TYPE_OPTIONS_INTERNAL: Option<ActivityType>[] = [
  { value: 'CALL', label: { ja: '電話', en: 'Call' } },
  { value: 'EMAIL', label: { ja: 'メール', en: 'Email' } },
  { value: 'MEETING', label: { ja: 'ミーティング', en: 'Meeting' } },
  { value: 'NOTE', label: { ja: 'メモ', en: 'Note' } },
  { value: 'OTHER', label: { ja: 'その他', en: 'Other' } },
];

const TASK_PRIORITY_OPTIONS_INTERNAL: Option<TaskPriority>[] = [
  { value: 'LOW', label: { ja: '低', en: 'Low' } },
  { value: 'MEDIUM', label: { ja: '中', en: 'Medium' } },
  { value: 'HIGH', label: { ja: '高', en: 'High' } },
  { value: 'URGENT', label: { ja: '至急', en: 'Urgent' } },
];

const TASK_STATUS_LABELS: Record<Locale, Record<TaskStatus, string>> = {
  ja: {
    OPEN: '未着手',
    IN_PROGRESS: '進行中',
    COMPLETED: '完了',
    BLOCKED: 'ブロック中',
    CANCELLED: 'キャンセル',
  },
  en: {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    BLOCKED: 'Blocked',
    CANCELLED: 'Cancelled',
  },
};

const OPPORTUNITY_STATUS_LABELS: Record<Locale, Record<OpportunityStatus, string>> = {
  ja: {
    OPEN: '進行中',
    WON: '成約',
    LOST: '失注',
    ARCHIVED: 'アーカイブ',
  },
  en: {
    OPEN: 'Open',
    WON: 'Won',
    LOST: 'Lost',
    ARCHIVED: 'Archived',
  },
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

const PIPELINE_STAGE_LABELS: Record<Locale, Record<string, string>> = {
  ja: {
    Prospecting: '見込み発掘',
    Qualified: 'ニーズ確認',
    Proposal: '提案中',
    Negotiation: '交渉中',
    'Closed Won': '成約',
    'Closed Lost': '失注',
  },
  en: {
    Prospecting: 'Prospecting',
    Qualified: 'Qualified',
    Proposal: 'Proposal',
    Negotiation: 'Negotiation',
    'Closed Won': 'Closed Won',
    'Closed Lost': 'Closed Lost',
  },
};

function buildMap<T extends string>(options: Option<T>[]) {
  return options.reduce<Record<Locale, Record<T, string>>>((map, option) => {
    Object.entries(option.label).forEach(([locale, label]) => {
      if (!map[locale as Locale]) {
        map[locale as Locale] = {} as Record<T, string>;
      }
      map[locale as Locale][option.value] = label;
    });
    return map;
  }, {} as Record<Locale, Record<T, string>>);
}

const ACCOUNT_STATUS_LABELS = buildMap(ACCOUNT_STATUS_OPTIONS_INTERNAL);
const ACTIVITY_TYPE_LABELS = buildMap(ACTIVITY_TYPE_OPTIONS_INTERNAL);
const TASK_PRIORITY_LABELS = buildMap(TASK_PRIORITY_OPTIONS_INTERNAL);

function getLabel<T extends string>(map: Record<Locale, Record<T, string>>, value?: T | null, locale: Locale = defaultLocale) {
  if (!value) {
    return '—';
  }
  const localized = map[locale]?.[value];
  if (localized) return localized;
  return map[defaultLocale]?.[value] ?? value;
}

export function getAccountStatusOptions(locale: Locale = defaultLocale, opts?: { includeArchived?: boolean }) {
  const includeArchived = opts?.includeArchived ?? true;
  const source = includeArchived ? ACCOUNT_STATUS_OPTIONS_INTERNAL : ACCOUNT_STATUS_OPTIONS_INTERNAL.filter((option) => option.value !== 'ARCHIVED');
  return source.map((option) => ({ value: option.value, label: option.label[locale] ?? option.label[defaultLocale] }));
}

export function getActivityTypeOptions(locale: Locale = defaultLocale) {
  return ACTIVITY_TYPE_OPTIONS_INTERNAL.map((option) => ({ value: option.value, label: option.label[locale] ?? option.label[defaultLocale] }));
}

export function getTaskPriorityOptions(locale: Locale = defaultLocale) {
  return TASK_PRIORITY_OPTIONS_INTERNAL.map((option) => ({ value: option.value, label: option.label[locale] ?? option.label[defaultLocale] }));
}

export function getAccountStatusLabel(status?: AccountStatus | null, locale: Locale = defaultLocale) {
  return getLabel(ACCOUNT_STATUS_LABELS, status, locale);
}

export function getAccountStatusMeta(status?: AccountStatus | null, locale: Locale = defaultLocale) {
  const label = getAccountStatusLabel(status, locale);
  const tone = status ? ACCOUNT_STATUS_TONES[status] ?? 'neutral' : 'neutral';
  return { label, tone };
}

export function getActivityTypeLabel(type?: ActivityType | null, locale: Locale = defaultLocale) {
  return getLabel(ACTIVITY_TYPE_LABELS, type, locale);
}

export function getTaskPriorityLabel(priority?: TaskPriority | null, locale: Locale = defaultLocale) {
  return getLabel(TASK_PRIORITY_LABELS, priority, locale);
}

export function getTaskStatusLabel(status?: TaskStatus | null, locale: Locale = defaultLocale) {
  return getLabel(TASK_STATUS_LABELS, status, locale);
}

export function getTaskStatusMeta(status?: TaskStatus | null, locale: Locale = defaultLocale) {
  const label = getTaskStatusLabel(status, locale);
  const tone = status ? TASK_STATUS_TONES[status] ?? 'neutral' : 'neutral';
  return { label, tone };
}

export function getOpportunityStatusLabel(status?: OpportunityStatus | null, locale: Locale = defaultLocale) {
  return getLabel(OPPORTUNITY_STATUS_LABELS, status, locale);
}

export function getOpportunityStatusMeta(status?: OpportunityStatus | null, locale: Locale = defaultLocale) {
  const label = getOpportunityStatusLabel(status, locale);
  const tone = status ? OPPORTUNITY_STATUS_TONES[status] ?? 'neutral' : 'neutral';
  return { label, tone };
}

export function getPipelineStageLabel(name?: string | null, locale: Locale = defaultLocale) {
  if (!name) return '—';
  return PIPELINE_STAGE_LABELS[locale]?.[name] ?? PIPELINE_STAGE_LABELS[defaultLocale]?.[name] ?? name;
}
