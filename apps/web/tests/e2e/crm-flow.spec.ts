import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const screenshotDir = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const adminEmail = process.env.PLAYWRIGHT_USER_EMAIL ?? 'admin@crm.local';
const adminPassword = process.env.PLAYWRIGHT_USER_PASSWORD ?? 'ChangeMe123!';

async function capture(page, name: string) {
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: true });
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function expectToast(page, ...texts: string[]) {
  const pattern = new RegExp(texts.map(escapeRegExp).join('|'));
  await expect(page.getByTestId('global-toast')).toHaveText(pattern);
}

test('主要 CRM フロー @snapshot', async ({ page }) => {
  const info = test.info();
  const slug = `${Date.now()}-${info.project.name}-${info.workerIndex}`;
  const accountName = `Playwright Account ${slug}`;
  const opportunityName = `Playwright Deal ${slug}`;
  const taskName = `Follow up ${slug}`;
  const activitySubject = `Demo call ${slug}`;
  await page.goto('/');
  await page.getByTestId('login-email').fill(adminEmail);
  await page.getByTestId('login-password').fill(adminPassword);
  await page.getByTestId('login-submit').click();
  await page.getByTestId('dashboard-page');
  await capture(page, 'dashboard');

  await page.getByTestId('nav-accounts').click();
  await page.getByTestId('accounts-page');
  await page.locator('form[data-testid="account-form"] input[name="name"]').fill(accountName);
  await page.locator('form[data-testid="account-form"] input[name="industry"]').fill('Software');
  await page.locator('form[data-testid="account-form"] input[name="annualRevenue"]').fill('123000');
  await page.getByTestId('account-submit').click();
  await expectToast(page, 'アカウントを保存しました。', 'Account saved.');
  await expect(page.getByRole('link', { name: accountName })).toBeVisible();
  await capture(page, 'accounts');

  await page.getByTestId('nav-opportunities').click();
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
  await expectToast(page, '案件を登録しました。', 'Opportunity created.');
  const createdOpportunityLink = page.getByTestId('opportunity-link').filter({ hasText: opportunityName }).first();
  await expect(createdOpportunityLink).toBeVisible();
  await capture(page, 'opportunities');

  await createdOpportunityLink.click();
  await page.getByTestId('opportunity-detail-page');
  const stageForm = page.getByTestId('opportunity-stage-form');
  const detailStageSelect = stageForm.locator('select[name="stageId"]');
  const currentStage = await detailStageSelect.inputValue();
  const selectableStages = await detailStageSelect.locator('option').evaluateAll((options) => options.map((option) => option.value));
  const nextStage = selectableStages.find((value) => value && value !== currentStage) ?? currentStage;
  await detailStageSelect.selectOption(nextStage);
  await stageForm.locator('button[type="submit"]').click();
  await expectToast(page, 'ステージを更新しました。', 'Stage updated.');

  await page.getByTestId('nav-activities').click();
  await page.getByTestId('activities-page');
  await page.locator('form[data-testid="activity-form"] input[name="subject"]').fill(activitySubject);
  await page.locator('form[data-testid="activity-form"] select[name="accountId"]').selectOption({ label: accountName });
  await page.locator('form[data-testid="activity-form"] select[name="opportunityId"]').selectOption({ label: opportunityName });
  await page.getByTestId('activity-form').locator('button[type="submit"]').click();
  await expectToast(page, '活動を追加しました。', 'Activity added.');
  await expect(page.getByText(activitySubject)).toBeVisible();
  await capture(page, 'activities');

  await page.getByTestId('nav-tasks').click();
  await page.getByTestId('tasks-page');
  await page.locator('form[data-testid="task-form"] input[name="title"]').fill(taskName);
  await page.locator('form[data-testid="task-form"] select[name="accountId"]').selectOption({ label: accountName });
  await page.locator('form[data-testid="task-form"] select[name="opportunityId"]').selectOption({ label: opportunityName });
  await page.getByTestId('task-form').locator('button[type="submit"]').click();
  await expectToast(page, 'タスクを追加しました。', 'Task created.');
  const createdTask = page.getByTestId('task-row').filter({ hasText: taskName }).first();
  await expect(createdTask).toBeVisible();
  const toggleButton = createdTask.getByTestId('task-toggle');
  await toggleButton.click();
  await capture(page, 'tasks');

  // アカウント詳細でステータスのみ更新しトースト確認
  await page.getByTestId('nav-accounts').click();
  await page.getByTestId('accounts-page');
  await page.getByRole('link', { name: accountName }).first().click();
  await page.getByTestId('account-detail-page');
  const statusSelect = page.locator('form[data-testid="account-form"] select[name="status"]');
  const currentStatus = await statusSelect.inputValue();
  const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await statusSelect.selectOption(nextStatus);
  await page.getByTestId('account-submit').click();
  await expectToast(page, 'アカウントを保存しました。', 'Account saved.');
  await capture(page, 'accounts-detail-status-update');

  await page.getByTestId('nav-reports').click();
  await page.getByTestId('reports-page');
  await capture(page, 'reports');
});
