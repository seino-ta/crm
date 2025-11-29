import { apiFetch } from './api-client';
import type {
  Account,
  Activity,
  ActivityType,
  ApiMeta,
  Contact,
  Opportunity,
  OpportunityStatus,
  PipelineStage,
  StageReportRow,
  OwnerReportRow,
  Task,
  TaskStatus,
  AuditLog,
} from './types';

function toQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function listAccounts(params?: { search?: string; status?: string; page?: number; pageSize?: number; archived?: boolean }) {
  const query = toQuery(params ?? {});
  const { data, meta } = await apiFetch<Account[]>(`/accounts${query}`);
  return { data, meta: meta as ApiMeta | undefined };
}

export async function getAccount(id: string) {
  const { data } = await apiFetch<Account>(`/accounts/${id}`);
  return data;
}

export async function listContacts(params?: { accountId?: string; search?: string; page?: number; pageSize?: number }) {
  const query = toQuery(params ?? {});
  const { data, meta } = await apiFetch<Contact[]>(`/contacts${query}`);
  return { data, meta: meta as ApiMeta | undefined };
}

export async function getContact(id: string) {
  const { data } = await apiFetch<Contact>(`/contacts/${id}`);
  return data;
}

export async function listPipelineStages() {
  const { data } = await apiFetch<PipelineStage[]>(`/pipeline-stages`);
  return data.sort((a, b) => a.order - b.order);
}

export async function listOpportunities(params?: {
  search?: string;
  status?: OpportunityStatus;
  stageId?: string;
  ownerId?: string;
  accountId?: string;
  accountArchived?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const query = toQuery(params ?? {});
  const { data, meta } = await apiFetch<Opportunity[]>(`/opportunities${query}`);
  return { data, meta: meta as ApiMeta | undefined };
}

export async function getOpportunity(id: string) {
  const { data } = await apiFetch<Opportunity>(`/opportunities/${id}`);
  return data;
}

export async function listActivities(params?: {
  type?: ActivityType;
  userId?: string;
  accountId?: string;
  opportunityId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = toQuery(params ?? {});
  const { data, meta } = await apiFetch<Activity[]>(`/activities${query}`);
  return { data, meta: meta as ApiMeta | undefined };
}

export async function listTasks(params?: {
  status?: TaskStatus;
  ownerId?: string;
  accountId?: string;
  opportunityId?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = toQuery(params ?? {});
  const { data, meta } = await apiFetch<Task[]>(`/tasks${query}`);
  return { data, meta: meta as ApiMeta | undefined };
}

export async function getStageReport() {
  const { data } = await apiFetch<StageReportRow[]>(`/reports/pipeline-stage`);
  return data;
}

export async function getOwnerReport() {
  const { data } = await apiFetch<OwnerReportRow[]>(`/reports/owner`);
  return data;
}

export async function listAuditLogs(params?: {
  page?: number;
  pageSize?: number;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  const query = toQuery(params ?? {});
  const { data, meta } = await apiFetch<AuditLog[]>(`/audit-logs${query}`);
  return { data, meta: meta as ApiMeta | undefined };
}
