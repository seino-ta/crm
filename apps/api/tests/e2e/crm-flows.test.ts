import { ActivityType, LeadStatus, TaskStatus } from '@prisma/client';
import type { Test } from 'supertest';

import { loginAsAdmin } from './helpers/auth';
import { expectApiSuccess } from './helpers/response';
import { api } from './helpers/supertest';

const auth = (token: string) => (req: Test) => req.set('Authorization', `Bearer ${token}`);

type UserSummary = { id: string; email: string };
type StageSummary = { id: string; name: string };
type AccountSummary = { id: string; name: string };
type ContactSummary = { id: string };
type OpportunitySummary = { id: string; stage: { id: string }; name: string };
type TaskSummary = { id: string; status: TaskStatus };
type ActivitySummary = { id: string };
type LeadSummary = { id: string; status: LeadStatus };
type AuditLogRow = { id: string };
type PipelineStageReportRow = { stageId: string; _count: { _all: number }; _sum: { amount: number | null } };
type OwnerReportRow = { ownerId: string; _count: { _all: number }; _sum: { amount: number | null } };

describe('CRM end-to-end flows', () => {
  let token: string;
  let adminId: string;
  let prospectStageId: string;
  let qualifiedStageId: string;

  beforeAll(async () => {
    const login = await loginAsAdmin();
    token = login.token;
    const authed = auth(token);

    // adminユーザーID取得
    const usersRes = await authed(api().get('/api/users').query({ search: 'admin' }));
    expect(usersRes.status).toBe(200);
    const usersBody = expectApiSuccess<UserSummary[]>(usersRes);
    const resolvedAdminId = usersBody.data.find((u) => u.email === 'admin@crm.local')?.id ?? usersBody.data[0]?.id;
    if (!resolvedAdminId) {
      throw new Error('admin user not found');
    }
    adminId = resolvedAdminId;

    // パイプラインステージ取得
    const stageRes = await authed(api().get('/api/pipeline-stages'));
    expect(stageRes.status).toBe(200);
    const stagesBody = expectApiSuccess<StageSummary[]>(stageRes);
    const stages = stagesBody.data;
    const resolvedProspectId = stages.find((s) => s.name === 'Prospecting')?.id ?? stages[0]?.id;
    const resolvedQualifiedId = stages.find((s) => s.name === 'Qualified')?.id ?? stages[1]?.id;
    if (!resolvedProspectId || !resolvedQualifiedId) {
      throw new Error('pipeline stages not found');
    }
    prospectStageId = resolvedProspectId;
    qualifiedStageId = resolvedQualifiedId;
  });

  it('covers accounts/contacts/opportunities/tasks/activities/leads/audit/reports end-to-end', async () => {
    const authed = auth(token);
    const base = `E2E-${Date.now()}`;

    // Account 作成
    const accountName = `${base}-Account`;
    const accountRes = await authed(api().post('/api/accounts').send({ name: accountName, industry: 'Software' }));
    expect(accountRes.status).toBe(201);
    const accountBody = expectApiSuccess<AccountSummary>(accountRes);
    const accountId = accountBody.data.id;
    expect(accountId).toBeTruthy();

    // Account 検索
    const accountList = await authed(api().get('/api/accounts').query({ search: base }));
    expect(accountList.status).toBe(200);
    const accountListBody = expectApiSuccess<AccountSummary[]>(accountList);
    expect(accountListBody.data.map((a) => a.id)).toContain(accountId);

    // Contact 作成
    const contactEmail = `${base.toLowerCase()}@example.com`;
    const contactRes = await authed(api().post('/api/contacts').send({
      accountId,
      firstName: 'E2E',
      lastName: 'Contact',
      email: contactEmail,
      phone: '+1-555-1234',
    }));
    expect(contactRes.status).toBe(201);
    const contactBody = expectApiSuccess<ContactSummary>(contactRes);
    const contactId = contactBody.data.id;
    expect(contactId).toBeTruthy();

    // Contact 検索
    const contactList = await authed(api().get('/api/contacts').query({ search: 'E2E' }));
    expect(contactList.status).toBe(200);
    const contactListBody = expectApiSuccess<ContactSummary[]>(contactList);
    expect(contactListBody.data.map((c) => c.id)).toContain(contactId);

    // Opportunity 作成
    const oppName = `${base}-Opportunity`;
    const oppCreate = await authed(api().post('/api/opportunities').send({
      name: oppName,
      accountId,
      ownerId: adminId,
      stageId: prospectStageId,
      contactId,
      amount: 123000,
      probability: 20,
    }));
    expect(oppCreate.status).toBe(201);
    const opportunityBody = expectApiSuccess<OpportunitySummary>(oppCreate);
    const opportunityId = opportunityBody.data.id;
    expect(opportunityId).toBeTruthy();

    // Opportunity 検索
    const oppList = await authed(api().get('/api/opportunities').query({ search: oppName }));
    expect(oppList.status).toBe(200);
    const oppListBody = expectApiSuccess<OpportunitySummary[]>(oppList);
    expect(oppListBody.data.map((o) => o.id)).toContain(opportunityId);

    // Opportunity ステージ変更 (Prospecting -> Qualified)
    const oppUpdate = await authed(api().put(`/api/opportunities/${opportunityId}`).send({
      stageId: qualifiedStageId,
      amount: 150000,
    }));
    expect(oppUpdate.status).toBe(200);
    const oppUpdateBody = expectApiSuccess<OpportunitySummary>(oppUpdate);
    expect(oppUpdateBody.data.stage.id).toBe(qualifiedStageId);

    // ステージ変更に伴う自動タスク生成を確認
    const taskListForOpp = await authed(api().get('/api/tasks').query({ opportunityId }));
    expect(taskListForOpp.status).toBe(200);
    const taskListBody = expectApiSuccess<TaskSummary[]>(taskListForOpp);
    expect(taskListBody.data.length).toBeGreaterThan(0);

    // ステージ変更に伴う自動アクティビティ生成を確認
    const activityListForOpp = await authed(api().get('/api/activities').query({ opportunityId }));
    expect(activityListForOpp.status).toBe(200);
    const activityListBody = expectApiSuccess<ActivitySummary[]>(activityListForOpp);
    expect(activityListBody.data.length).toBeGreaterThan(0);

    // 手動タスク作成 → 完了
    const manualTaskTitle = `${base}-Task`;
    const taskCreate = await authed(api().post('/api/tasks').send({
      title: manualTaskTitle,
      ownerId: adminId,
      accountId,
      opportunityId,
    }));
    expect(taskCreate.status).toBe(201);
    const taskCreateBody = expectApiSuccess<TaskSummary>(taskCreate);
    const taskId = taskCreateBody.data.id;

    const taskUpdate = await authed(api().put(`/api/tasks/${taskId}`).send({ status: TaskStatus.COMPLETED }));
    expect(taskUpdate.status).toBe(200);
    const taskUpdateBody = expectApiSuccess<TaskSummary>(taskUpdate);
    expect(taskUpdateBody.data.status).toBe(TaskStatus.COMPLETED);

    // タスク検索（title 部分一致）
    const taskSearch = await authed(api().get('/api/tasks').query({ search: manualTaskTitle }));
    expect(taskSearch.status).toBe(200);
    const taskSearchBody = expectApiSuccess<TaskSummary[]>(taskSearch);
    expect(taskSearchBody.data.map((t) => t.id)).toContain(taskId);

    // 手動アクティビティ作成
    const activitySubject = `${base}-Meeting`;
    const activityCreate = await authed(api().post('/api/activities').send({
      type: ActivityType.MEETING,
      subject: activitySubject,
      userId: adminId,
      accountId,
      contactId,
      opportunityId,
    }));
    expect(activityCreate.status).toBe(201);
    const activityCreateBody = expectApiSuccess<ActivitySummary>(activityCreate);
    const activityId = activityCreateBody.data.id;
    expect(activityId).toBeTruthy();

    // アクティビティ検索（subject 部分一致）
    const activitySearch = await authed(api().get('/api/activities').query({ search: base }));
    expect(activitySearch.status).toBe(200);
    const activitySearchBody = expectApiSuccess<ActivitySummary[]>(activitySearch);
    expect(activitySearchBody.data.map((a) => a.id)).toContain(activityId);

    // Lead 作成 → ステータス更新
    const leadName = `${base}-Lead`;
    const leadCreate = await authed(api().post('/api/leads').send({
      name: leadName,
      ownerId: adminId,
      accountId,
      email: `${base.toLowerCase()}+lead@example.com`,
    }));
    expect(leadCreate.status).toBe(201);
    const leadCreateBody = expectApiSuccess<LeadSummary>(leadCreate);
    const leadId = leadCreateBody.data.id;

    const leadUpdate = await authed(api().put(`/api/leads/${leadId}`).send({ status: LeadStatus.QUALIFIED }));
    expect(leadUpdate.status).toBe(200);
    const leadUpdateBody = expectApiSuccess<LeadSummary>(leadUpdate);
    expect(leadUpdateBody.data.status).toBe(LeadStatus.QUALIFIED);

    // リード検索
    const leadSearch = await authed(api().get('/api/leads').query({ search: leadName }));
    expect(leadSearch.status).toBe(200);
    const leadSearchBody = expectApiSuccess<LeadSummary[]>(leadSearch);
    expect(leadSearchBody.data.map((l) => l.id)).toContain(leadId);

    // AuditLog ステージ変更記録確認
    const auditRes = await authed(api().get('/api/audit-logs').query({ entityId: opportunityId, action: 'STAGE_CHANGE' }));
    expect(auditRes.status).toBe(200);
    const auditBody = expectApiSuccess<AuditLogRow[]>(auditRes);
    expect(auditBody.data.length).toBeGreaterThan(0);

    // レポートAPI
    const pipelineReport = await authed(api().get('/api/reports/pipeline-stage'));
    expect(pipelineReport.status).toBe(200);
    const pipelineReportBody = expectApiSuccess<PipelineStageReportRow[]>(pipelineReport);
    expect(Array.isArray(pipelineReportBody.data)).toBe(true);

    const ownerReport = await authed(api().get('/api/reports/owner'));
    expect(ownerReport.status).toBe(200);
    const ownerReportBody = expectApiSuccess<OwnerReportRow[]>(ownerReport);
    expect(Array.isArray(ownerReportBody.data)).toBe(true);
  });
});
