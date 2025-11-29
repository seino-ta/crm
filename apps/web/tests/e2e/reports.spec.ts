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
  });
});
