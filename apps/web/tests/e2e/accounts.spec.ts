import { test, expect } from '@playwright/test';

import { createAccount, createSlug, getAccountByName, login, openAccountDetail } from './support/crm-helpers';

const INDUSTRY = 'Software';

test.describe('Accounts', () => {
  test('create account and ensure it appears in list', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Playwright Account ${slug}`;

    await login(page);
    await createAccount(page, { name: accountName, industry: INDUSTRY, revenue: '123000' });

    const accountLink = page.getByRole('link', { name: accountName }).first();
    await expect(accountLink).toBeVisible();
    await expect.poll(async () => {
      const account = await getAccountByName(page, accountName);
      return account?.status;
    }).toBe('ACTIVE');
  });

  test('view account detail from list', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `View Account ${slug}`;

    await login(page);
    await createAccount(page, { name: accountName, industry: INDUSTRY });
    await openAccountDetail(page, accountName);

    await expect(page.getByRole('heading', { name: accountName })).toBeVisible();
    await expect(page.locator('form[data-testid="account-form"] input[name="name"]')).toHaveValue(accountName);
  });
});
