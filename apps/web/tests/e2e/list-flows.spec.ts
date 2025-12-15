import { test, expect } from '@playwright/test';
import {
  login,
  createSlug,
  apiCreateAccount,
  apiCreateOpportunity,
  apiInviteUser,
  apiCreateActivity,
  apiCreateTask,
  safeGoto,
  createTask,
} from './support/crm-helpers';

test.describe('List flows (search / paging / size / CRUD guards)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Accounts: search, change page size, paginate', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const prefix = `Acct ${slug}`;
    // create 12 accounts to force a second page
    for (let i = 0; i < 12; i += 1) {
      await apiCreateAccount(page, { name: `${prefix}-${i}`, industry: 'Testing' });
    }

    await safeGoto(page, '/accounts');
    await page.getByRole('textbox', { name: /search/i }).fill(prefix);
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForURL(/accounts/);

    await page.selectOption('select[name="pageSize"]', '10');
    await page.waitForURL(/pageSize=10/);

    const rows = page.getByTestId('account-link');
    await expect(rows).toHaveCount(10);
    await page.getByText(/next/i).first().click();
    await page.waitForURL(/page=2/);
    const countPage2 = await rows.count();
    expect(countPage2).toBeGreaterThan(0);
    await expect(page).toHaveURL(/search=/);
  });

  test('Tasks: search change resets page to 1', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Task Acc ${slug}`;
    await apiCreateAccount(page, { name: accountName });
    await createTask(page, { title: `Alpha ${slug}`, accountName });
    await createTask(page, { title: `Beta ${slug}`, accountName });

    await safeGoto(page, '/tasks');
    await page.getByRole('textbox', { name: /search/i }).fill('Alpha');
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForURL(/tasks/);
    await page.selectOption('select[name="pageSize"]', '10');
    await page.waitForURL(/pageSize=10/);

    // change search to Beta and ensure page resets
    await page.getByRole('textbox', { name: /search/i }).fill(`Beta ${slug}`);
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForURL(/tasks/);
    const params = new URL(page.url()).searchParams;
    const pageParam = params.get('page');
    expect(pageParam === null || pageParam === '1').toBeTruthy();
    await expect(page.getByTestId('task-row').filter({ hasText: `Beta ${slug}` }).first()).toBeVisible();
  });

  test('Accounts: search change resets page to 1', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const prefixA = `AcctA-${slug}`;
    const prefixB = `AcctB-${slug}`;

    for (let i = 0; i < 12; i += 1) {
      await apiCreateAccount(page, { name: `${prefixA}-${i}`, industry: 'Testing' });
    }
    await apiCreateAccount(page, { name: `${prefixB}-only`, industry: 'Testing' });

    await safeGoto(page, '/accounts');
    await page.getByRole('textbox', { name: /search/i }).fill(prefixA);
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForURL(/accounts/);
    await page.selectOption('select[name="pageSize"]', '10');
    await page.waitForURL(/pageSize=10/);
    const accountsNext = page.getByRole('link', { name: /next|次へ/i }).first();
    await expect(accountsNext).toBeVisible();
    await accountsNext.click();
    await page.waitForURL(/page=2/);

    await page.getByRole('textbox', { name: /search/i }).fill(prefixB);
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForURL(/accounts/);
    const params = new URL(page.url()).searchParams;
    const pageParam = params.get('page');
    expect(pageParam === null || pageParam === '1').toBeTruthy();
    await expect(page.getByTestId('account-link').filter({ hasText: prefixB })).toBeVisible();
  });

  test('Opportunities: search, change page size, paginate', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `OppList-${slug}`;
    const prefix = `Opp-${slug}`;
    const account = await apiCreateAccount(page, { name: accountName, industry: 'SaaS' });

    for (let i = 0; i < 12; i += 1) {
      await apiCreateOpportunity(page, { name: `${prefix}-${i}`, accountId: account.id });
    }

    await safeGoto(page, '/opportunities');
    await page.getByRole('textbox', { name: /search/i }).fill(prefix);
    await page.getByRole('button', { name: /search/i }).click();
    await page.waitForURL(/opportunities/);

    await page.selectOption('select[name="pageSize"]', '10');
    await page.waitForURL(/pageSize=10/);
    const rows = page.getByTestId('opportunity-link');
    await expect(rows).toHaveCount(10);
    const oppNext = page.getByRole('link', { name: /next|次へ/i }).first();
    await expect(oppNext).toBeVisible();
    await oppNext.click();
    await page.waitForURL(/page=2/);
    await expect(rows.first()).toBeVisible();
    await expect(page).toHaveURL(/search=/);
  });

  test('Users: page size keeps filters', async ({ page }) => {
    await safeGoto(page, '/admin/users?status=active');
    await page.selectOption('select[name="pageSize"]', '10');
    await page.waitForURL(/status=active/);
    await expect(page).toHaveURL(/pageSize=10/);
  });

  test('Contacts: empty state when no results', async ({ page }, testInfo) => {
    const term = `NoHit-${createSlug(testInfo)}`;
    await safeGoto(page, '/contacts');
    await page.getByRole('textbox', { name: /search/i }).fill(term);
    await page.getByRole('button', { name: /search/i }).click();
    await expect(page.getByText(/No contacts found|該当するコンタクトが見つかりません。/)).toBeVisible();
  });

  test('Tasks: page>total redirects to last page', async ({ page }) => {
    await safeGoto(page, '/tasks?page=999&pageSize=20');
    // リダイレクト後のクエリを確認
    const params = new URL(page.url()).searchParams;
    const pageParam = Number(params.get('page') ?? '1');
    expect(pageParam).toBeLessThan(999);
  });

  test('Audit Logs: filters stay when paging and page size changes', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const prefix = `AuditAcc-${slug}`;
    for (let i = 0; i < 12; i += 1) {
      await apiCreateAccount(page, { name: `${prefix}-${i}`, industry: 'Logs' });
    }

    await safeGoto(page, `/admin/audit-logs?entityType=Account&pageSize=5`);
    await page.getByTestId('audit-logs-page');
    await expect(page.locator('tbody tr').first()).toBeVisible();

    const auditNext = page.getByRole('link', { name: /next|次へ/i }).first();
    await expect(auditNext).toBeVisible();
    await auditNext.click();
    await page.waitForURL(/page=2/);
    await expect(page).toHaveURL(/entityType=Account/);

    await page.selectOption('#audit-toolbar-page-size', '10');
    await page.waitForURL(/pageSize=10/);
    await expect(page).toHaveURL(/entityType=Account/);
  });

  test('Tasks: validation error is shown when title is too short', async ({ page }) => {
    await safeGoto(page, '/tasks');
    await page.getByTestId('tasks-page');
    await page.locator('form[data-testid="task-form"] input[name="title"]').fill('x');
    await page.getByTestId('task-form').locator('button[type="submit"]').click();
    await expect(page.getByText(/入力内容を確認してください。|Check the form fields./)).toBeVisible();
  });

  test('Audit Logs: invalid date range shows empty state', async ({ page }) => {
    await safeGoto(page, '/admin/audit-logs?from=2030-01-02&to=2030-01-01');
    await page.getByTestId('audit-logs-page');
    await expect(page.getByText(/監査ログはありません|No audit logs match the filters/)).toBeVisible();
  });

  test('Users: duplicate email shows request error', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const email = `dup-${slug}@crm.local`;
    await login(page);
    await apiInviteUser(page, { email, firstName: 'Dup', lastName: 'Seed', role: 'REP' });

    await safeGoto(page, '/admin/users');
    await page.getByTestId('admin-users-page');
    await page.getByTestId('invite-user-form').locator('input[name="email"]').fill(email);
    await page.getByTestId('invite-user-form').locator('input[name="firstName"]').fill('Dup');
    await page.getByTestId('invite-user-form').locator('input[name="lastName"]').fill('Again');
    await page.getByTestId('invite-user-form').locator('select[name="role"]').selectOption('REP');
    await page.getByTestId('invite-submit').click();
    await expect(page.getByText(/リクエストに失敗しました|Request failed/)).toBeVisible();
  });

  test('Users: invite shows server error toast when forced 500', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const email = `force500-${slug}@crm.local`;

    await login(page);
    await safeGoto(page, '/admin/users');
    await page.getByTestId('admin-users-page');

    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="invite-user-form"]');
      if (!form) return;
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = '__e2e_force_error';
      hidden.value = '500';
      form.appendChild(hidden);
    });

    await page.getByTestId('invite-user-form').locator('input[name="email"]').fill(email);
    await page.getByTestId('invite-user-form').locator('input[name="firstName"]').fill('Err');
    await page.getByTestId('invite-user-form').locator('input[name="lastName"]').fill('Case');
    await page.getByTestId('invite-user-form').locator('select[name="role"]').selectOption('REP');
    await page.getByTestId('invite-submit').click();

    await expect(page.getByText(/リクエストに失敗しました|Request failed/)).toBeVisible();
  });

  test('Activities: date range filters results and invalid range is empty', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const account = await apiCreateAccount(page, { name: `ActDate-${slug}`, industry: 'DateTest' });
    await apiCreateActivity(page, { subject: `Old-${slug}`, accountId: account.id, occurredAt: '2025-01-01T00:00:00.000Z' });
    await apiCreateActivity(page, { subject: `New-${slug}`, accountId: account.id, occurredAt: '2025-01-05T00:00:00.000Z' });

    await safeGoto(page, `/activities?search=${slug}&from=2025-01-04&to=2025-01-06`);
    await page.getByTestId('activities-page');
    await expect(page.getByText(`New-${slug}`)).toBeVisible();
    await expect(page.getByText(`Old-${slug}`)).toHaveCount(0);

    await safeGoto(page, `/activities?search=${slug}&from=2025-01-06&to=2025-01-04`);
    await expect(page.getByTestId('activity-row')).toHaveCount(0);
  });

  test('Activities: from only / to only keep correct subset', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const account = await apiCreateAccount(page, { name: `ActDate2-${slug}`, industry: 'DateTest' });
    await apiCreateActivity(page, { subject: `Act-Early-${slug}`, accountId: account.id, occurredAt: '2025-03-01T00:00:00.000Z' });
    await apiCreateActivity(page, { subject: `Act-Late-${slug}`, accountId: account.id, occurredAt: '2025-03-10T00:00:00.000Z' });

    // from only should include late, exclude early
    await safeGoto(page, `/activities?search=${slug}&from=2025-03-05`);
    await page.getByTestId('activities-page');
    await expect(page.getByText(`Act-Late-${slug}`)).toBeVisible();
    await expect(page.getByText(`Act-Early-${slug}`)).toHaveCount(0);

    // to only should include early, exclude late
    await safeGoto(page, `/activities?search=${slug}&to=2025-03-05`);
    await page.getByTestId('activities-page');
    await expect(page.getByText(`Act-Early-${slug}`)).toBeVisible();
    await expect(page.getByText(`Act-Late-${slug}`)).toHaveCount(0);
  });

  test('Activities: type filter selects activity type', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    await login(page);
    const account = await apiCreateAccount(page, { name: `ActType-${slug}`, industry: 'TypeTest' });
    await apiCreateActivity(page, { subject: `TypeEmail-${slug}`, accountId: account.id, type: 'EMAIL' });
    await apiCreateActivity(page, { subject: `TypeCall-${slug}`, accountId: account.id, type: 'CALL' });

    await safeGoto(page, `/activities?type=EMAIL&search=TypeEmail-${slug}`);
    await page.getByTestId('activities-page');
    const emailRows = page.getByTestId('activity-row').filter({ hasText: `TypeEmail-${slug}` });
    await expect.poll(async () => emailRows.count()).toBeGreaterThan(0);
    await expect(page.getByText(`TypeCall-${slug}`)).toHaveCount(0);
  });

  test('Activities: type + date range filters combined', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    await login(page);
    const account = await apiCreateAccount(page, { name: `ActCombo-${slug}`, industry: 'Combo' });
    await apiCreateActivity(page, { subject: `ComboHit-${slug}`, accountId: account.id, type: 'CALL', occurredAt: '2025-06-02T00:00:00.000Z' });
    await apiCreateActivity(page, { subject: `ComboMiss-${slug}`, accountId: account.id, type: 'EMAIL', occurredAt: '2025-06-10T00:00:00.000Z' });

    await safeGoto(page, `/activities?type=CALL&from=2025-06-01&to=2025-06-05&pageSize=50`);
    await page.getByTestId('activities-page');
    await expect(page.getByText(`ComboHit-${slug}`)).toBeVisible();
    await expect(page.getByText(`ComboMiss-${slug}`)).toHaveCount(0);
  });

  test('Tasks: due date filter inputs persist and page size keeps params', async ({ page }) => {
    await safeGoto(page, '/tasks?dueAfter=2025-02-05&dueBefore=2025-02-05');
    await page.getByTestId('tasks-page');
    await expect(page.locator('input[type="date"][name="dueAfter"]')).toHaveValue('2025-02-05');
    await expect(page.locator('input[type="date"][name="dueBefore"]')).toHaveValue('2025-02-05');

    await page.selectOption('select[name="pageSize"]', '50');
    await page.waitForURL(/dueAfter=2025-02-05/);
    await expect(page).toHaveURL(/dueBefore=2025-02-05/);
  });

  test('Tasks: search matches owner name as well as title', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const account = await apiCreateAccount(page, { name: `TaskOwner-${slug}`, industry: 'Test' });
    const ownerKeyword = 'Aiko';

    await apiCreateTask(page, { title: `OwnerMatch-${slug}`, accountId: account.id });

    await safeGoto(page, `/tasks?search=${ownerKeyword}`);
    await page.getByTestId('tasks-page');
    await expect(page.getByText(`OwnerMatch-${slug}`)).toBeVisible();
  });

  test('Tasks: owner keyword + due range works together', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    await login(page);
    const account = await apiCreateAccount(page, { name: `TaskCombo-${slug}`, industry: 'Combo' });
    await apiCreateTask(page, { title: `ComboHit-${slug}`, accountId: account.id, dueDate: '2025-07-01' });
    await apiCreateTask(page, { title: `ComboMiss-${slug}`, accountId: account.id, dueDate: '2025-07-20' });

    await safeGoto(page, `/tasks?search=Aiko&dueAfter=2025-06-25&dueBefore=2025-07-05&pageSize=50`);
    await page.getByTestId('tasks-page');
    await expect(page.getByText(`ComboHit-${slug}`)).toBeVisible();
    await expect(page.getByText(`ComboMiss-${slug}`)).toHaveCount(0);
  });

  test('Tasks: dueAfter only / dueBefore only / same-day filters', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const account = await apiCreateAccount(page, { name: `TaskDate2-${slug}`, industry: 'DateTest' });
    await apiCreateTask(page, { title: `Task-Early-${slug}`, accountId: account.id, dueDate: '2025-04-01' });
    await apiCreateTask(page, { title: `Task-Late-${slug}`, accountId: account.id, dueDate: '2025-04-10' });

    // dueAfter only -> lateのみ
    await safeGoto(page, `/tasks?search=${slug}&dueAfter=2025-04-05`);
    await page.getByTestId('tasks-page');
    await expect(page.getByText(`Task-Late-${slug}`)).toBeVisible();
    await expect(page.getByText(`Task-Early-${slug}`)).toHaveCount(0);

    // dueBefore only -> earlyのみ
    await safeGoto(page, `/tasks?search=${slug}&dueBefore=2025-04-05`);
    await page.getByTestId('tasks-page');
    await expect(page.getByText(`Task-Early-${slug}`)).toBeVisible();
    await expect(page.getByText(`Task-Late-${slug}`)).toHaveCount(0);

    // same-day range -> earlyのみ
    await safeGoto(page, `/tasks?search=${slug}&dueAfter=2025-04-01&dueBefore=2025-04-01`);
    await page.getByTestId('tasks-page');
    await expect(page.getByText(`Task-Early-${slug}`)).toBeVisible();
    await expect(page.getByText(`Task-Late-${slug}`)).toHaveCount(0);
  });

  test('Opportunities: search matches account name', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const account = await apiCreateAccount(page, { name: `OppAcc-${slug}`, industry: 'Acct' });
    await apiCreateOpportunity(page, { name: `OppByAccount-${slug}`, accountId: account.id });

    await safeGoto(page, `/opportunities?search=OppAcc-${slug}`);
    await page.getByTestId('opportunities-page');
    await expect(page.getByTestId('opportunity-link').filter({ hasText: `OppByAccount-${slug}` }).first()).toBeVisible();
  });

  test('Users: keyword + role + status keeps filters', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const email = `combo-${slug}@crm.local`;
    await login(page);
    await apiInviteUser(page, { email, firstName: 'Combo', lastName: 'User', role: 'REP' });

    await safeGoto(page, `/admin/users?search=${slug}&role=REP&status=active&pageSize=50`);
    await page.getByTestId('admin-users-page');
    await expect(page.getByTestId('user-row').filter({ hasText: email })).toBeVisible();
    await page.selectOption('select[name=\"pageSize\"]', '20');
    await page.waitForURL(/search=/);
    await expect(page).toHaveURL(/role=REP/);
    await expect(page).toHaveURL(/status=active/);
  });

  test('Permissions: REP は管理メニューにアクセスできない', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const email = `rep-${slug}@crm.local`;
    const firstName = `Rep ${slug}`;

    await safeGoto(page, '/admin/users');
    await page.getByTestId('admin-users-page');
    await page.getByTestId('invite-user-form').locator('input[name="email"]').fill(email);
    await page.getByTestId('invite-user-form').locator('input[name="firstName"]').fill(firstName);
    await page.getByTestId('invite-user-form').locator('input[name="lastName"]').fill('Tester');
    await page.getByTestId('invite-user-form').locator('select[name="role"]').selectOption('REP');
    await page.getByTestId('invite-submit').click();
    const tempPasswordBlock = page.getByTestId('invite-temp-password');
    await expect(tempPasswordBlock).toBeVisible();
    const tempPasswordText = await tempPasswordBlock.innerText();
    const tempPassword = tempPasswordText.trim().split('\n').pop()?.trim() ?? '';
    expect(tempPassword.length).toBeGreaterThan(5);

    await page.context().clearCookies();
    await login(page, { email, password: tempPassword });

    await expect(page.getByTestId('nav-users')).toHaveCount(0);
    await expect(page.getByTestId('nav-auditLogs')).toHaveCount(0);

    await safeGoto(page, '/admin/audit-logs');
    await expect(page.getByText(/Not Found|見つかりません|404/)).toBeVisible();
  });
});
