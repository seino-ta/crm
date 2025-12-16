import { api } from './helpers/supertest';
import { loginAsAdmin } from './helpers/auth';

describe('accounts e2e', () => {
  let token: string;

  beforeAll(async () => {
    const login = await loginAsAdmin();
    token = login.token;
  });

  it('creates, reads, updates, deletes, and restores an account', async () => {
    const name = `E2E Account ${Date.now()}`;

    // create
    const createRes = await api()
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, industry: 'Software' });
    expect(createRes.status).toBe(201);
    const accountId = createRes.body?.data?.id as string;
    expect(accountId).toBeTruthy();

    // get
    const getRes = await api()
      .get(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body?.data?.name).toBe(name);

    // update
    const updatedName = `${name} Updated`;
    const updateRes = await api()
      .put(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: updatedName, phone: '+1-555-0101' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body?.data?.name).toBe(updatedName);
    expect(updateRes.body?.data?.phone).toBe('+1-555-0101');

    // soft delete
    const deleteRes = await api()
      .delete(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    // confirm archived
    const archivedRes = await api()
      .get(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(archivedRes.status).toBe(200);
    expect(archivedRes.body?.data?.deletedAt).toBeTruthy();

    // restore
    const restoreRes = await api()
      .post(`/api/accounts/${accountId}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body?.data?.deletedAt).toBeNull();

    // search list should contain restored account
    const listRes = await api()
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: name.split(' ')[1] });
    expect(listRes.status).toBe(200);
    const ids = (listRes.body?.data ?? []).map((a: any) => a.id);
    expect(ids).toContain(accountId);
  });
});
