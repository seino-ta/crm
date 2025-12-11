import { expect, type Page, type TestInfo } from '@playwright/test';

export const adminEmail = process.env.PLAYWRIGHT_USER_EMAIL ?? 'admin@crm.local';
export const adminPassword = process.env.PLAYWRIGHT_USER_PASSWORD ?? 'ChangeMe123!';
const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000/api';
const webBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const webUrl = new URL(webBaseUrl);
let sessionToken: string | null = null;
let sessionUserId: string | null = null;
let defaultStageId: string | null = null;

export async function safeGoto(page: Page, path: string) {
  try {
    await page.goto(path);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('NS_BINDING_ABORTED')) {
      throw error;
    }
  }
  await page.waitForLoadState('domcontentloaded');
}

export function createSlug(testInfo: TestInfo) {
  return `${Date.now()}-${testInfo.project.name}-${testInfo.workerIndex}`;
}

export async function login(page: Page) {
  const response = await page.request.post(`${apiBaseUrl}/auth/login`, {
    data: { email: adminEmail, password: adminPassword },
  });
  if (!response.ok()) {
    throw new Error(`Failed to login via API: ${response.status()} ${response.statusText()}`);
  }
  const payload = (await response.json()) as { data?: { token?: string } };
  const token = payload?.data?.token;
  if (!token) {
    throw new Error('Login API did not return a token');
  }
  sessionToken = token;
  sessionUserId = null;
  await page.context().addCookies([
    {
      name: 'crm_token',
      value: token,
      domain: webUrl.hostname,
      path: '/',
      httpOnly: true,
      secure: webUrl.protocol === 'https:',
    },
  ]);
  await page.goto('/dashboard');
  await page.getByTestId('dashboard-page');
  await ensureUserId(page);
}

export async function expectToast(page: Page, ...texts: string[]) {
  const pattern = new RegExp(texts.map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));
  await expect(page.getByTestId('global-toast')).toHaveText(pattern);
}

export async function createAccount(page: Page, params: { name: string; industry?: string; revenue?: string }) {
  await safeGoto(page, '/accounts');
  await page.getByTestId('accounts-page');
  await page.locator('form[data-testid="account-form"] input[name="name"]').fill(params.name);
  if (params.industry) {
    await page.locator('form[data-testid="account-form"] input[name="industry"]').fill(params.industry);
  }
  if (params.revenue) {
    await page.locator('form[data-testid="account-form"] input[name="annualRevenue"]').fill(params.revenue);
  }
  await page.getByTestId('account-submit').click();
  await expectToast(page, 'アカウントを保存しました。', 'Account saved.');
}

export async function openAccountDetail(page: Page, accountName: string) {
  await safeGoto(page, '/accounts');
  await page.getByTestId('accounts-page');
  await page.getByRole('link', { name: accountName }).first().click();
  await page.getByTestId('account-detail-page');
}

export async function getAccountByName(page: Page, accountName: string) {
  const response = await page.request.get(`${apiBaseUrl}/accounts`, {
    params: { search: accountName, pageSize: '50' },
    ...(sessionToken ? { headers: { authorization: `Bearer ${sessionToken}` } } : {}),
  });
  if (!response.ok()) {
    throw new Error(`Failed to fetch accounts: ${response.status()} ${response.statusText()}`);
  }
  const payload = (await response.json()) as { data?: Array<{ id: string; name: string; status: string }> };
  return payload.data?.find((account) => account.name === accountName);
}

function authHeaders() {
  if (!sessionToken) {
    throw new Error('Must login before calling API helpers');
  }
  return { authorization: `Bearer ${sessionToken}` };
}

async function ensureUserId(page: Page) {
  if (sessionUserId) {
    return sessionUserId;
  }
  const response = await page.request.get(`${apiBaseUrl}/auth/me`, {
    headers: authHeaders(),
  });
  if (!response.ok()) {
    throw new Error(`Failed to fetch current user: ${response.status()} ${response.statusText()}`);
  }
  const payload = (await response.json()) as { data?: { user?: { id: string } } };
  const userId = payload.data?.user?.id;
  if (!userId) {
    throw new Error('Current user response missing id');
  }
  sessionUserId = userId;
  return sessionUserId;
}

async function ensureDefaultStageId(page: Page) {
  if (defaultStageId) {
    return defaultStageId;
  }
  const response = await page.request.get(`${apiBaseUrl}/pipeline-stages`, {
    headers: authHeaders(),
  });
  if (!response.ok()) {
    throw new Error(`Failed to fetch pipeline stages: ${response.status()} ${response.statusText()}`);
  }
  const payload = (await response.json()) as { data?: Array<{ id: string; order: number }> };
  const firstStage = payload.data?.sort((a, b) => a.order - b.order)[0];
  if (!firstStage) {
    throw new Error('No pipeline stages available');
  }
  defaultStageId = firstStage.id;
  return defaultStageId;
}

export async function apiCreateAccount(page: Page, params: { name: string; industry?: string }) {
  const response = await page.request.post(`${apiBaseUrl}/accounts`, {
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    data: {
      name: params.name,
      industry: params.industry ?? null,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create account via API: ${response.status()} ${response.statusText()}`);
  }
  const payload = (await response.json()) as { data?: { id: string; name: string } };
  if (!payload.data) {
    throw new Error('Account API response missing data');
  }
  return payload.data;
}

export async function apiCreateOpportunity(page: Page, params: { name: string; accountId: string; amount?: string; probability?: string }) {
  const ownerId = await ensureUserId(page);
  const stageId = await ensureDefaultStageId(page);
  const response = await page.request.post(`${apiBaseUrl}/opportunities`, {
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    data: {
      name: params.name,
      accountId: params.accountId,
      ownerId,
      stageId,
      amount: params.amount ? Number(params.amount) : undefined,
      probability: params.probability ? Number(params.probability) : undefined,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create opportunity via API: ${response.status()} ${response.statusText()}`);
  }
  const payload = (await response.json()) as { data?: { id: string; name: string } };
  if (!payload.data) {
    throw new Error('Opportunity API response missing data');
  }
  return payload.data;
}

export async function apiCreateLead(page: Page, params: { name: string; ownerId?: string; status?: string; accountId?: string }) {
  const ownerId = params.ownerId ?? (await ensureUserId(page));
  const response = await page.request.post(`${apiBaseUrl}/leads`, {
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    data: {
      name: params.name,
      ownerId,
      status: params.status,
      accountId: params.accountId,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create lead via API: ${response.status()} ${response.statusText()}`);
  }
  const payload = (await response.json()) as { data?: { id: string; name: string } };
  if (!payload.data) {
    throw new Error('Lead API response missing data');
  }
  return payload.data;
}

export async function createContact(page: Page, params: {
  accountName: string;
  firstName: string;
  lastName: string;
  email: string;
  kanaFirst?: string;
  kanaLast?: string;
}) {
  await safeGoto(page, '/contacts');
  await page.getByTestId('contacts-page');
  await page.locator('form[data-testid="contact-form"] input[name="firstName"]').fill(params.firstName);
  await page.locator('form[data-testid="contact-form"] input[name="lastName"]').fill(params.lastName);
  await page.locator('form[data-testid="contact-form"] input[name="kanaFirstName"]').fill(params.kanaFirst ?? 'テスト');
  await page.locator('form[data-testid="contact-form"] input[name="kanaLastName"]').fill(params.kanaLast ?? 'テスト');
  await page.locator('form[data-testid="contact-form"] input[name="email"]').fill(params.email);
  await page.locator('form[data-testid="contact-form"] select[name="accountId"]').selectOption({ label: params.accountName });
  await page.getByTestId('contact-submit').click();
  await expectToast(page, 'コンタクトを追加しました。', 'Contact created.');
  return `${params.lastName} ${params.firstName}`;
}

export async function createOpportunity(page: Page, params: {
  name: string;
  accountName: string;
  amount?: string;
  probability?: string;
}) {
  await safeGoto(page, '/opportunities');
  await page.getByTestId('opportunities-page');
  await page.locator('form[data-testid="opportunity-form"] input[name="name"]').fill(params.name);
  await page.locator('form[data-testid="opportunity-form"] select[name="accountId"]').selectOption({ label: params.accountName });
  const stageSelect = page.locator('form[data-testid="opportunity-form"] select[name="stageId"]');
  const options = await stageSelect.locator('option:not([value=""])').all();
  if (options.length > 0) {
    const first = await options[0]?.getAttribute('value');
    if (first) {
      await stageSelect.selectOption(first);
    }
  }
  if (params.amount) {
    await page.locator('form[data-testid="opportunity-form"] input[name="amount"]').fill(params.amount);
  }
  if (params.probability) {
    await page.locator('form[data-testid="opportunity-form"] input[name="probability"]').fill(params.probability);
  }
  await page.getByTestId('opportunity-form').locator('button[type="submit"]').click();
  await expectToast(page, '案件を登録しました。', 'Opportunity created.');
}

export async function createActivity(page: Page, params: { subject: string; accountName: string; opportunityName?: string }) {
  await safeGoto(page, '/activities');
  await page.getByTestId('activities-page');
  await page.locator('form[data-testid="activity-form"] input[name="subject"]').fill(params.subject);
  await page.locator('form[data-testid="activity-form"] select[name="accountId"]').selectOption({ label: params.accountName });
  if (params.opportunityName) {
    await page.locator('form[data-testid="activity-form"] select[name="opportunityId"]').selectOption({ label: params.opportunityName });
  }
  await page.getByTestId('activity-form').locator('button[type="submit"]').click();
  await expectToast(page, '活動を追加しました。', 'Activity added.');
}

export async function createTask(page: Page, params: { title: string; accountName: string; opportunityName?: string }) {
  await safeGoto(page, '/tasks');
  await page.getByTestId('tasks-page');
  await page.locator('form[data-testid="task-form"] input[name="title"]').fill(params.title);
  await page.locator('form[data-testid="task-form"] select[name="accountId"]').selectOption({ label: params.accountName });
  if (params.opportunityName) {
    await page.locator('form[data-testid="task-form"] select[name="opportunityId"]').selectOption({ label: params.opportunityName });
  }
  await page.getByTestId('task-form').locator('button[type="submit"]').click();
  await expectToast(page, 'タスクを追加しました。', 'Task created.');
}
