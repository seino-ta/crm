import { test, expect } from '@playwright/test';

import { createAccount, createOpportunity, createSlug, login, safeGoto } from './support/crm-helpers';

test.describe('Reports', () => {
  test('view pipeline report', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Report Account ${slug}`;
    const opportunityName = `Report Deal ${slug}`;

    await login(page);
    await createAccount(page, { name: accountName, industry: 'Analytics' });
    await createOpportunity(page, { name: opportunityName, accountName, amount: '10000' });

    await safeGoto(page, '/reports');
    await expect(page.getByTestId('reports-page')).toBeVisible();

    // ステージ別テーブルに今回作成した案件の金額と件数が反映されることを確認
    const stageTable = page.getByTestId('reports-page').locator('table').nth(0);
    await expect(stageTable).toContainText(/Prospecting/i);
    await expect(stageTable).toContainText(/10,?000/);
    await expect(stageTable).toContainText(/\b1\b/);

    // オーナー別テーブルに管理者の集計が載ることを確認
    const ownerTable = page.getByTestId('reports-page').locator('table').nth(1);
    await expect(ownerTable).toContainText(/admin@crm\.local/);
    await expect(ownerTable).toContainText(/10,?000/);
  });
});
