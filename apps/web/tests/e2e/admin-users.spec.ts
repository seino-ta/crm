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

    await userRow.getByTestId('user-detail-link').click();
    await page.getByTestId('admin-user-detail-page');

    const roleForm = page.getByTestId('user-role-form');
    await roleForm.locator('select[name="role"]').selectOption('MANAGER');
    await roleForm.getByRole('button').click();
    await expect(roleForm.locator('select[name="role"]')).toHaveValue('MANAGER');

    const dialogPromise = new Promise<void>((resolve) => {
      page.once('dialog', (dialog) => {
        dialog.accept();
        resolve();
      });
    });
    await page.getByTestId('user-status-form').getByRole('button').click();
    await dialogPromise;
    await expect(page.getByTestId('admin-user-detail-page')).toContainText('Inactive');

    await safeGoto(page, '/admin/users');
    await page.getByTestId('admin-users-page');
    const updatedRow = page.getByTestId('user-row').filter({ hasText: email }).first();
    await expect(updatedRow).toContainText('Manager');
    await expect(updatedRow).toContainText('Inactive');

    await safeGoto(page, '/admin/audit-logs');
    await page.getByTestId('audit-logs-page');
    const auditForm = page.locator('form[action="/admin/audit-logs"]');
    await auditForm.locator('input[name="entityType"]').fill('User');
    await auditForm.locator('button[type="submit"]').click();
    await expect(page.getByText(email, { exact: false })).toBeVisible();
  });
});
