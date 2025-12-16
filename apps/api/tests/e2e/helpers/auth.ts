import { api } from './supertest';

type LoginResult = { token: string };

export async function loginAsAdmin(): Promise<LoginResult> {
  const email = process.env.PLAYWRIGHT_USER_EMAIL ?? 'admin@crm.local';
  const password = process.env.PLAYWRIGHT_USER_PASSWORD ?? 'ChangeMe123!';

  const res = await api()
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Login failed: ${res.status} ${res.text}`);
  }

  return { token: res.body.data.token };
}
