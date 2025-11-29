import { test, expect } from '@playwright/test';

import {
  createAccount,
  createContact,
  createSlug,
  expectToast,
  login,
  openAccountDetail,
  safeGoto,
} from './support/crm-helpers';

test.describe('Contacts CRUD', () => {
  test('create, edit, and soft delete contact', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Contacts Account ${slug}`;
    const contactFirstName = `Hanako ${slug}`;
    const contactLastName = `Client ${slug}`;
    const contactEmail = `contact-${slug}@crm.local`;
    const updatedJobTitle = `Director ${slug}`;
    const updatedPhone = `080-${String(testInfo.workerIndex).padStart(2, '0')}00-1234`;

    await login(page);
    await createAccount(page, { name: accountName, industry: 'Software' });
    const fullName = await createContact(page, {
      accountName,
      firstName: contactFirstName,
      lastName: contactLastName,
      email: contactEmail,
    });

    const contactRow = page.getByTestId('contact-row').filter({ hasText: fullName }).first();
    await expect(contactRow).toBeVisible();

    await openAccountDetail(page, accountName);
    await expect(page.getByTestId('account-contacts-section')).toContainText(contactFirstName);

    await safeGoto(page, '/contacts');
    await page.getByTestId('contacts-page');
    await contactRow.getByTestId('contact-edit-link').click();
    await page.getByTestId('contact-edit-page');
    await page.getByTestId('contact-edit-form').locator('input[name="phone"]').fill(updatedPhone);
    await page.getByTestId('contact-edit-form').locator('input[name="jobTitle"]').fill(updatedJobTitle);
    await page.getByTestId('contact-edit-submit').click();
    await expectToast(page, 'コンタクトを更新しました。', 'Contact updated.');

    await openAccountDetail(page, accountName);
    await expect(page.getByTestId('account-contact-row').filter({ hasText: updatedJobTitle })).toBeVisible();

    await safeGoto(page, '/contacts');
    await page.getByTestId('contacts-page');
    const dialogPromise = new Promise<void>((resolve) => {
      page.once('dialog', (dialog) => {
        dialog.accept();
        resolve();
      });
    });
    await contactRow.getByTestId('contact-delete-button').click();
    await dialogPromise;
    await expectToast(page, 'コンタクトをアーカイブしました。', 'Contact archived.');
    await expect(page.getByTestId('contact-row').filter({ hasText: fullName })).toHaveCount(0);

    await openAccountDetail(page, accountName);
    await expect(page.getByTestId('account-contacts-empty')).toBeVisible();
  });
});
