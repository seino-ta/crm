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
  const contactFirstName = `Hanako ${slug}`;
  const contactLastName = `Client ${slug}`;
  const opportunityName = `Playwright Deal ${slug}`;
  const taskName = `Follow up ${slug}`;
  const activitySubject = `Demo call ${slug}`;
  const contactFullName = `${contactLastName} ${contactFirstName}`;
  const updatedJobTitle = `Director ${slug}`;
  const updatedPhone = `080-${String(info.workerIndex).padStart(2, '0')}00-1234`;
  await page.goto('/');
  await page.getByTestId('login-email').fill(adminEmail);
  await page.getByTestId('login-password').fill(adminPassword);
  await page.getByTestId('login-submit').click();
  await page.getByTestId('dashboard-page');
  await capture(page, 'dashboard');
  await page.goto('/accounts');
  await page.getByTestId('accounts-page');
  await page.locator('form[data-testid="account-form"] input[name="name"]').fill(accountName);
  await page.locator('form[data-testid="account-form"] input[name="industry"]').fill('Software');
  await page.locator('form[data-testid="account-form"] input[name="annualRevenue"]').fill('123000');
  await page.getByTestId('account-submit').click();
  await expectToast(page, 'アカウントを保存しました。', 'Account saved.');
  await expect(page.getByRole('link', { name: accountName })).toBeVisible();
  await capture(page, 'accounts');

  await page.goto('/contacts');
  await page.getByTestId('contacts-page');
  await page.locator('form[data-testid="contact-form"] input[name="firstName"]').fill(contactFirstName);
  await page.locator('form[data-testid="contact-form"] input[name="lastName"]').fill(contactLastName);
  await page.locator('form[data-testid="contact-form"] input[name="kanaFirstName"]').fill('ハナコ');
  await page.locator('form[data-testid="contact-form"] input[name="kanaLastName"]').fill('クライアント');
  await page.locator('form[data-testid="contact-form"] input[name="email"]').fill(`contact-${slug}@crm.local`);
  await page.locator('form[data-testid="contact-form"] select[name="accountId"]').selectOption({ label: accountName });
  await page.getByTestId('contact-submit').click();
  await expectToast(page, 'コンタクトを追加しました。', 'Contact created.');
  const contactRow = page.getByTestId('contact-row').filter({ hasText: contactFullName }).first();
  await expect(contactRow).toBeVisible();

  // アカウント詳細でコンタクト表示を確認
  await contactRow.getByRole('link', { name: accountName }).first().click();
  await page.getByTestId('account-detail-page');
  const contactsSection = page.getByTestId('account-contacts-section');
  await expect(contactsSection).toContainText(contactFirstName);
  await page.goto('/contacts');
  await page.getByTestId('contacts-page');

  // 編集ページで情報更新
  await contactRow.getByTestId('contact-edit-link').click();
  await page.getByTestId('contact-edit-page');
  await page.getByTestId('contact-edit-form').locator('input[name="phone"]').fill(updatedPhone);
  await page.getByTestId('contact-edit-form').locator('input[name="jobTitle"]').fill(updatedJobTitle);
  await page.getByTestId('contact-edit-submit').click();
  await expectToast(page, 'コンタクトを更新しました。', 'Contact updated.');

  // 更新内容がアカウント詳細に反映されることを確認
  await page.goto('/accounts');
  await page.getByTestId('accounts-page');
  await page.getByRole('link', { name: accountName }).first().click();
  await page.getByTestId('account-detail-page');
  await expect(page.getByTestId('account-contact-row').filter({ hasText: updatedJobTitle })).toBeVisible();

  // コン タクトを論理削除
  await page.goto('/contacts');
  await page.getByTestId('contacts-page');
  const dialogPromise = new Promise<void>((resolve) => {
    page.once('dialog', (dialog) => {
      dialog.accept();
      resolve();
    });
  });
  await contactRow.getByTestId('contact-delete-button').click();
  await dialogPromise;
  await expectToast(page, 'コンタクトをアーカイブしました。', 'Contact archived.');
  await expect(page.getByTestId('contact-row').filter({ hasText: contactFullName })).toHaveCount(0);

  // アカウント詳細でコンタクトが非表示になったことを確認
  await page.goto('/accounts');
  await page.getByTestId('accounts-page');
  await page.getByRole('link', { name: accountName }).first().click();
  await page.getByTestId('account-detail-page');
  await expect(page.getByTestId('account-contacts-empty')).toBeVisible();

  await page.goto('/opportunities');
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

  await page.goto('/activities');
  await page.getByTestId('activities-page');
  await page.locator('form[data-testid="activity-form"] input[name="subject"]').fill(activitySubject);
  await page.locator('form[data-testid="activity-form"] select[name="accountId"]').selectOption({ label: accountName });
  await page.locator('form[data-testid="activity-form"] select[name="opportunityId"]').selectOption({ label: opportunityName });
  await page.getByTestId('activity-form').locator('button[type="submit"]').click();
  await expectToast(page, '活動を追加しました。', 'Activity added.');
  await expect(page.getByText(activitySubject)).toBeVisible();
  await capture(page, 'activities');

  await page.goto('/tasks');
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
  await page.goto('/accounts');
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

  await page.goto('/reports');
  await page.getByTestId('reports-page');
  await capture(page, 'reports');

  await page.goto('/admin/audit-logs');
  await page.getByTestId('audit-logs-page');
  const auditForm = page.locator('form[action="/admin/audit-logs"]');
  await auditForm.locator('input[name="entityType"]').fill('Contact');
  await auditForm.locator('button[type="submit"]').click();
  await expect(page.getByText('Contact', { exact: false })).toBeVisible();
  await expect(page.getByText(contactFirstName, { exact: false })).toBeVisible();
});
