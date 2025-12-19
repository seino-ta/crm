import { expectApiError, expectApiSuccess } from './helpers/response';
import { api } from './helpers/supertest';

describe('auth login', () => {
  it('logs in with seeded admin credentials', async () => {
    const email = process.env.PLAYWRIGHT_USER_EMAIL ?? 'admin@crm.local';
    const password = process.env.PLAYWRIGHT_USER_PASSWORD ?? 'ChangeMe123!';

    const res = await api()
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    const body = expectApiSuccess<{ token: string }>(res);
    expect(body.data.token).toBeTruthy();
  });

  it('rejects invalid credentials', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'admin@crm.local', password: 'wrongpass' });

    expect(res.status).toBe(401);
    const body = expectApiError(res);
    expect(body.error.message).toBeTruthy();
  });
});
