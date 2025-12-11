import { test, expect } from '@playwright/test';

import { apiCreateAccount, createSlug, login, safeGoto } from './support/crm-helpers';

test.describe('Leads', () => {
  test('create lead, change status, delete', async ({ page }, testInfo) => {
    page.on('dialog', (dialog) => dialog.accept());

    const slug = createSlug(testInfo);
    const leadName = `Lead ${slug}`;
    const accountName = `Lead Account ${slug}`;

    await login(page);

    // 事前にアカウントを作成しておく（既存アカウント紐付けのUI確認用）
    const account = await apiCreateAccount(page, { name: accountName });

    await safeGoto(page, '/leads');
    await page.getByTestId('leads-page');

    // 作成フォーム入力
    await page.locator('form[data-testid="lead-form"] input[name="name"]').fill(leadName);
    await page.locator('form[data-testid="lead-form"] select[name="accountId"]').selectOption({ value: account.id });
    await page.getByTestId('lead-form').getByRole('button', { name: /リードを登録|Create lead/ }).click();

    // 作成されたリードを確認
    const leadRow = page.getByTestId('lead-row').filter({ hasText: leadName }).first();
    await expect(leadRow).toBeVisible();

    // ステータスを QUALIFIED に変更
    await leadRow.getByRole('combobox').selectOption('QUALIFIED');
    await expect(leadRow.getByTestId('lead-status')).toContainText(/QUALIFIED|有望/);

    // 削除
    await leadRow.getByRole('button', { name: /削除|Delete/ }).click();
    await page.waitForTimeout(300); // confirm ダイアログの待機
    await page.waitForLoadState('networkidle');
    await expect(leadRow).not.toBeAttached();
  });
});
