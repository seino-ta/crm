import { test, expect } from '@playwright/test';

import { createAccount, createContact, createSlug, login, safeGoto } from './support/crm-helpers';

test.describe('Audit Logs', () => {
  test('filter contact audit entries', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Audit Account ${slug}`;
    const contactFirstName = `Yuki ${slug}`;
    const contactLastName = 'Audit';
    const email = `audit-${slug}@crm.local`;

    await login(page);
    await createAccount(page, { name: accountName, industry: 'Finance' });
    await createContact(page, { accountName, firstName: contactFirstName, lastName: contactLastName, email });

    await safeGoto(page, '/admin/audit-logs');
    await page.getByTestId('audit-logs-page');
    const auditForm = page.locator('form[action="/admin/audit-logs"]');
    await auditForm.locator('input[name="entityType"]').fill('Contact');
    await auditForm.locator('button[type="submit"]').click();

    await expect(page.getByText(contactFirstName, { exact: false })).toBeVisible();
  });
});
