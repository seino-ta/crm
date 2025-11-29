import { test, expect } from '@playwright/test';

import { createAccount, createActivity, createSlug, login } from './support/crm-helpers';

test.describe('Activities', () => {
  test('log activity for an account', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Activity Account ${slug}`;
    const subject = `Call ${slug}`;

    await login(page);
    await createAccount(page, { name: accountName, industry: 'Services' });
    await createActivity(page, { subject, accountName });

    await expect(page.getByText(subject)).toBeVisible();
  });
});
