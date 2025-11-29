import { test, expect } from '@playwright/test';

import { createAccount, createOpportunity, createSlug, expectToast, login } from './support/crm-helpers';

test.describe('Opportunities', () => {
  test('create opportunity and update stage', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Opp Account ${slug}`;
    const opportunityName = `Deal ${slug}`;

    await login(page);
    await createAccount(page, { name: accountName, industry: 'Manufacturing' });
    await createOpportunity(page, {
      name: opportunityName,
      accountName,
      amount: '25000',
      probability: '70',
    });

    const opportunityLink = page.getByTestId('opportunity-link').filter({ hasText: opportunityName }).first();
    await expect(opportunityLink).toBeVisible();
    await opportunityLink.click();
    await page.getByTestId('opportunity-detail-page');

    const stageForm = page.getByTestId('opportunity-stage-form');
    const stageSelect = stageForm.locator('select[name="stageId"]');
    const currentStage = await stageSelect.inputValue();
    const selectableStages = await stageSelect.locator('option').evaluateAll((options) => options.map((option) => option.value));
    const nextStage = selectableStages.find((value) => value && value !== currentStage) ?? currentStage;
    await stageSelect.selectOption(nextStage);
    await stageForm.locator('button[type="submit"]').click();
    await expectToast(page, 'ステージを更新しました。', 'Stage updated.');
  });
});
