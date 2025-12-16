import { ActivityType, LeadStatus, TaskStatus } from '@prisma/client';
import { api } from './helpers/supertest';
import { loginAsAdmin } from './helpers/auth';

const auth = (token: string) => (req: ReturnType<typeof api>) => req.set('Authorization', `Bearer ${token}`);

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
    adminId = usersRes.body?.data?.find((u: any) => u.email === 'admin@crm.local')?.id ?? usersRes.body?.data?.[0]?.id;
    expect(adminId).toBeTruthy();

    // パイプラインステージ取得
    const stageRes = await authed(api().get('/api/pipeline-stages'));
    expect(stageRes.status).toBe(200);
    const stages: any[] = stageRes.body?.data ?? [];
    prospectStageId = stages.find((s) => s.name === 'Prospecting')?.id ?? stages[0]?.id;
    qualifiedStageId = stages.find((s) => s.name === 'Qualified')?.id ?? stages[1]?.id;
    expect(prospectStageId).toBeTruthy();
    expect(qualifiedStageId).toBeTruthy();
  });

  it('covers accounts/contacts/opportunities/tasks/activities/leads/audit/reports end-to-end', async () => {
    const authed = auth(token);
    const base = `E2E-${Date.now()}`;

    // Account 作成
    const accountName = `${base}-Account`;
    const accountRes = await authed(api().post('/api/accounts').send({ name: accountName, industry: 'Software' }));
    expect(accountRes.status).toBe(201);
    const accountId = accountRes.body?.data?.id;
    expect(accountId).toBeTruthy();

    // Account 検索
    const accountList = await authed(api().get('/api/accounts').query({ search: base }));
    expect(accountList.status).toBe(200);
    expect((accountList.body?.data ?? []).map((a: any) => a.id)).toContain(accountId);

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
    const contactId = contactRes.body?.data?.id;
    expect(contactId).toBeTruthy();

    // Contact 検索
    const contactList = await authed(api().get('/api/contacts').query({ search: 'E2E' }));
    expect(contactList.status).toBe(200);
    expect((contactList.body?.data ?? []).map((c: any) => c.id)).toContain(contactId);

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
    const opportunityId = oppCreate.body?.data?.id;
    expect(opportunityId).toBeTruthy();

    // Opportunity 検索
    const oppList = await authed(api().get('/api/opportunities').query({ search: oppName }));
    expect(oppList.status).toBe(200);
    expect((oppList.body?.data ?? []).map((o: any) => o.id)).toContain(opportunityId);

    // Opportunity ステージ変更 (Prospecting -> Qualified)
    const oppUpdate = await authed(api().put(`/api/opportunities/${opportunityId}`).send({
      stageId: qualifiedStageId,
      amount: 150000,
    }));
    expect(oppUpdate.status).toBe(200);
    expect(oppUpdate.body?.data?.stage?.id).toBe(qualifiedStageId);

    // ステージ変更に伴う自動タスク生成を確認
    const taskListForOpp = await authed(api().get('/api/tasks').query({ opportunityId }));
    expect(taskListForOpp.status).toBe(200);
    expect((taskListForOpp.body?.data ?? []).length).toBeGreaterThan(0);

    // ステージ変更に伴う自動アクティビティ生成を確認
    const activityListForOpp = await authed(api().get('/api/activities').query({ opportunityId }));
    expect(activityListForOpp.status).toBe(200);
    expect((activityListForOpp.body?.data ?? []).length).toBeGreaterThan(0);

    // 手動タスク作成 → 完了
    const manualTaskTitle = `${base}-Task`;
    const taskCreate = await authed(api().post('/api/tasks').send({
      title: manualTaskTitle,
      ownerId: adminId,
      accountId,
      opportunityId,
    }));
    expect(taskCreate.status).toBe(201);
    const taskId = taskCreate.body?.data?.id;

    const taskUpdate = await authed(api().put(`/api/tasks/${taskId}`).send({ status: TaskStatus.COMPLETED }));
    expect(taskUpdate.status).toBe(200);
    expect(taskUpdate.body?.data?.status).toBe(TaskStatus.COMPLETED);

    // タスク検索（title 部分一致）
    const taskSearch = await authed(api().get('/api/tasks').query({ search: manualTaskTitle }));
    expect(taskSearch.status).toBe(200);
    expect((taskSearch.body?.data ?? []).map((t: any) => t.id)).toContain(taskId);

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
    const activityId = activityCreate.body?.data?.id;
    expect(activityId).toBeTruthy();

    // アクティビティ検索（subject 部分一致）
    const activitySearch = await authed(api().get('/api/activities').query({ search: base }));
    expect(activitySearch.status).toBe(200);
    expect((activitySearch.body?.data ?? []).map((a: any) => a.id)).toContain(activityId);

    // Lead 作成 → ステータス更新
    const leadName = `${base}-Lead`;
    const leadCreate = await authed(api().post('/api/leads').send({
      name: leadName,
      ownerId: adminId,
      accountId,
      email: `${base.toLowerCase()}+lead@example.com`,
    }));
    expect(leadCreate.status).toBe(201);
    const leadId = leadCreate.body?.data?.id;

    const leadUpdate = await authed(api().put(`/api/leads/${leadId}`).send({ status: LeadStatus.QUALIFIED }));
    expect(leadUpdate.status).toBe(200);
    expect(leadUpdate.body?.data?.status).toBe(LeadStatus.QUALIFIED);

    // リード検索
    const leadSearch = await authed(api().get('/api/leads').query({ search: leadName }));
    expect(leadSearch.status).toBe(200);
    expect((leadSearch.body?.data ?? []).map((l: any) => l.id)).toContain(leadId);

    // AuditLog ステージ変更記録確認
    const auditRes = await authed(api().get('/api/audit-logs').query({ entityId: opportunityId, action: 'STAGE_CHANGE' }));
    expect(auditRes.status).toBe(200);
    expect((auditRes.body?.data ?? []).length).toBeGreaterThan(0);

    // レポートAPI
    const pipelineReport = await authed(api().get('/api/reports/pipeline-stage'));
    expect(pipelineReport.status).toBe(200);
    expect(Array.isArray(pipelineReport.body?.data)).toBe(true);

    const ownerReport = await authed(api().get('/api/reports/owner'));
    expect(ownerReport.status).toBe(200);
    expect(Array.isArray(ownerReport.body?.data)).toBe(true);
  });
});
