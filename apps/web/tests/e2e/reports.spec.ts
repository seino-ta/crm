import { test, expect } from '@playwright/test';

import {
  apiCreateAccount,
  apiCreateOpportunity,
  apiCreatePipelineStage,
  apiInviteUser,
  createSlug,
  login,
  safeGoto,
} from './support/crm-helpers';

test.describe('Reports', () => {
  test('view pipeline report', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Report Account ${slug}`;
    const opportunityName = `Report Deal ${slug}`;
    const stageName = `QA Stage ${slug}`;
    const ownerEmail = `report-owner-${slug}@crm.local`;

    await login(page);
    const invited = (await apiInviteUser(page, { email: ownerEmail, role: 'REP' })) as { user: { id: string } };
    const stage = await apiCreatePipelineStage(page, { name: stageName, probability: 10 });
    const account = await apiCreateAccount(page, { name: accountName, industry: 'Analytics' });
    await apiCreateOpportunity(page, {
      name: opportunityName,
      accountId: account.id,
      amount: '10000',
      stageId: stage.id,
      ownerId: invited.user.id,
    });

    await safeGoto(page, '/reports');
    await expect(page.getByTestId('reports-page')).toBeVisible();

    // ステージ別テーブルに今回作成した案件の金額と件数が反映されることを確認
    const stageTable = page.getByTestId('reports-page').locator('table').nth(0);
    await expect(stageTable).toContainText(stageName);
    await expect(stageTable).toContainText(/10,?000/);
    await expect(stageTable).toContainText(/\b1\b/);

    // オーナー別テーブルに管理者の集計が載ることを確認
    const ownerTable = page.getByTestId('reports-page').locator('table').nth(1);
    await expect(ownerTable).toContainText(ownerEmail);
    await expect(ownerTable).toContainText(/10,?000/);
  });
});
