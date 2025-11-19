import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const screenshotDir = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const adminEmail = process.env.PLAYWRIGHT_USER_EMAIL ?? 'admin@crm.local';
const adminPassword = process.env.PLAYWRIGHT_USER_PASSWORD ?? 'ChangeMe123!';

const now = Date.now();
const accountName = `Playwright Account ${now}`;
const opportunityName = `Playwright Deal ${now}`;
const taskName = `Follow up ${now}`;
const activitySubject = `Demo call ${now}`;

async function capture(page, name: string) {
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: true });
}

test('主要 CRM フロー @snapshot', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('login-email').fill(adminEmail);
  await page.getByTestId('login-password').fill(adminPassword);
  await page.getByTestId('login-submit').click();
  await page.getByTestId('dashboard-page');
  await capture(page, 'dashboard');

  await page.getByTestId('nav-アカウント').click();
  await page.getByTestId('accounts-page');
  await page.locator('form[data-testid="account-form"] input[name="name"]').fill(accountName);
  await page.locator('form[data-testid="account-form"] input[name="industry"]').fill('Software');
  await page.locator('form[data-testid="account-form"] input[name="annualRevenue"]').fill('123000');
  await page.getByTestId('account-submit').click();
  await expect(page.getByRole('link', { name: accountName })).toBeVisible();
  await capture(page, 'accounts');

  await page.getByTestId('nav-案件').click();
  await page.getByTestId('opportunities-page');
  await page.waitForSelector('form[data-testid="opportunity-form"] select[name="accountId"]');
  await page.locator('form[data-testid="opportunity-form"] input[name="name"]').fill(opportunityName);
  await page.locator('form[data-testid="opportunity-form"] select[name="accountId"]').selectOption({ label: accountName });
  const stageSelect = page.locator('form[data-testid="opportunity-form"] select[name="stageId"]');
  const options = await stageSelect.locator('option:not([value=""])').all();
  if (options.length > 0) {
    const first = await options[0].getAttribute('value');
    if (first) await stageSelect.selectOption(first);
  }
  await page.locator('form[data-testid="opportunity-form"] input[name="amount"]').fill('25000');
  await page.locator('form[data-testid="opportunity-form"] input[name="probability"]').fill('70');
  await page.getByTestId('opportunity-form').locator('button[type="submit"]').click();
  await expect(page.getByRole('link', { name: opportunityName })).toBeVisible();
  await capture(page, 'opportunities');

  await page.getByTestId('nav-活動ログ').click();
  await page.getByTestId('activities-page');
  await page.locator('form[data-testid="activity-form"] input[name="subject"]').fill(activitySubject);
  await page.locator('form[data-testid="activity-form"] select[name="accountId"]').selectOption({ label: accountName });
  await page.locator('form[data-testid="activity-form"] select[name="opportunityId"]').selectOption({ label: opportunityName });
  await page.getByTestId('activity-form').locator('button[type="submit"]').click();
  await expect(page.getByText(activitySubject)).toBeVisible();
  await capture(page, 'activities');

  await page.getByTestId('nav-タスク').click();
  await page.getByTestId('tasks-page');
  await page.locator('form[data-testid="task-form"] input[name="title"]').fill(taskName);
  await page.locator('form[data-testid="task-form"] select[name="accountId"]').selectOption({ label: accountName });
  await page.locator('form[data-testid="task-form"] select[name="opportunityId"]').selectOption({ label: opportunityName });
  await page.getByTestId('task-form').locator('button[type="submit"]').click();
  const createdTask = page.getByTestId('task-row').filter({ hasText: taskName }).first();
  await expect(createdTask).toBeVisible();
  const toggleButton = createdTask.getByTestId('task-toggle');
  await toggleButton.click();
  await capture(page, 'tasks');

  await page.getByTestId('nav-レポート').click();
  await page.getByTestId('reports-page');
  await capture(page, 'reports');
});
