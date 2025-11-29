import { test, expect } from '@playwright/test';

import { createSlug, login, safeGoto } from './support/crm-helpers';

const roles = ['ADMIN', 'MANAGER', 'REP'] as const;

test.describe('Admin Users', () => {
  test('invite user, change role, toggle status', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const email = `new-user-${slug}@crm.local`;
    const firstName = `Invite ${slug}`;
    const lastName = 'Target';

    await login(page);
    await safeGoto(page, '/admin/users');
    await page.getByTestId('admin-users-page');

    await page.getByTestId('invite-user-form').locator('input[name="email"]').fill(email);
    await page.getByTestId('invite-user-form').locator('input[name="firstName"]').fill(firstName);
    await page.getByTestId('invite-user-form').locator('input[name="lastName"]').fill(lastName);
    await page.getByTestId('invite-user-form').locator('select[name="role"]').selectOption('REP');
    await page.getByTestId('invite-submit').click();
    await expect(page.getByTestId('invite-temp-password')).toBeVisible();
    const userRow = page.getByTestId('user-row').filter({ hasText: email }).first();
    await expect(userRow).toBeVisible();

    const roleSelect = userRow.locator('select[name="role"]');
    await roleSelect.selectOption('MANAGER');
    await userRow.getByRole('button', { name: 'Save' }).click();
    await expect(roleSelect).toHaveValue('MANAGER');

    const toggleButton = userRow.getByTestId('user-status-toggle');
    await toggleButton.click();
    await expect(userRow).toContainText('Inactive');

    await safeGoto(page, '/admin/audit-logs');
    await page.getByTestId('audit-logs-page');
    const auditForm = page.locator('form[action="/admin/audit-logs"]');
    await auditForm.locator('input[name="entityType"]').fill('User');
    await auditForm.locator('button[type="submit"]').click();
    await expect(page.getByText(email, { exact: false })).toBeVisible();
  });
});
