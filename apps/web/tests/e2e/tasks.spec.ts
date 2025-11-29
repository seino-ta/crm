import { test, expect } from '@playwright/test';

import { apiCreateAccount, apiCreateOpportunity, createSlug, createTask, getAccountByName, login } from './support/crm-helpers';

test.describe('Tasks', () => {
  test('create task linked to opportunity', async ({ page }, testInfo) => {
    const slug = createSlug(testInfo);
    const accountName = `Task Account ${slug}`;
    const opportunityName = `Task Opportunity ${slug}`;
    const taskTitle = `Follow up ${slug}`;

    await login(page);
    await apiCreateAccount(page, { name: accountName, industry: 'SaaS' });
    const account = await getAccountByName(page, accountName);
    if (!account) {
      throw new Error('Account not found after API creation');
    }
    await apiCreateOpportunity(page, { name: opportunityName, accountId: account.id });
    await createTask(page, { title: taskTitle, accountName, opportunityName });

    const createdTask = page.getByTestId('task-row').filter({ hasText: taskTitle }).first();
    await expect(createdTask).toBeVisible();
    await createdTask.getByTestId('task-toggle').click();
  });
});
