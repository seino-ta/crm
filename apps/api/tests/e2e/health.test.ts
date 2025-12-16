import { api } from './helpers/supertest';

describe('health endpoints', () => {
  it('returns ok for /healthz', async () => {
    const res = await api().get('/api/healthz');
    expect(res.status).toBe(200);
    expect(res.body?.data?.status).toBe('ok');
  });
});
