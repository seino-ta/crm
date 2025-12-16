import { api } from './helpers/supertest';
import { loginAsAdmin } from './helpers/auth';

describe('reports API', () => {
  let token: string;
  let adminId: string;
  let stageId: string;

  beforeAll(async () => {
    const login = await loginAsAdmin();
    token = login.token;

    // 現在のユーザーID取得
    const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    adminId = me.body?.data?.user?.id as string;
    if (!adminId) throw new Error('admin id missing');

    // パイプラインステージの先頭を利用
    const stagesRes = await api().get('/api/pipeline-stages').set('Authorization', `Bearer ${token}`);
    stageId = stagesRes.body?.data?.[0]?.id as string;
    if (!stageId) throw new Error('stage id missing');
  });

  it('pipeline-stage / owner reports include newly created opportunity', async () => {
    const slug = `rep-${Date.now()}`;
    const amount = 12345;

    // account
    const accRes = await api()
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Report Acc ${slug}` });
    expect(accRes.status).toBe(201);
    const accountId = accRes.body?.data?.id as string;
    expect(accountId).toBeTruthy();

    // opportunity
    const oppRes = await api()
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Report Opp ${slug}`,
        accountId,
        ownerId: adminId,
        stageId,
        amount,
      });
    expect(oppRes.status).toBe(201);
    const opportunityId = oppRes.body?.data?.id as string;
    expect(opportunityId).toBeTruthy();

    // pipeline-stage report
    const stageReport = await api()
      .get('/api/reports/pipeline-stage')
      .set('Authorization', `Bearer ${token}`);
    expect(stageReport.status).toBe(200);
    const stageRow = (stageReport.body?.data as any[] | undefined)?.find((r) => r.stageId === stageId);
    expect(stageRow).toBeTruthy();
    expect(Number(stageRow._count._all)).toBeGreaterThanOrEqual(1);
    expect(Number(stageRow._sum.amount ?? 0)).toBeGreaterThanOrEqual(amount);

    // owner report
    const ownerReport = await api()
      .get('/api/reports/owner')
      .set('Authorization', `Bearer ${token}`);
    expect(ownerReport.status).toBe(200);
    const ownerRow = (ownerReport.body?.data as any[] | undefined)?.find((r) => r.ownerId === adminId);
    expect(ownerRow).toBeTruthy();
    expect(Number(ownerRow._count._all)).toBeGreaterThanOrEqual(1);
    expect(Number(ownerRow._sum.amount ?? 0)).toBeGreaterThanOrEqual(amount);
  });
});
