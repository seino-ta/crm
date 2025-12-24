import { test, expect } from '@playwright/test';

import { login, safeGoto } from './support/crm-helpers';

test.describe('Reports', () => {
  test('shows placeholder in lite mode', async ({ page }) => {
    await login(page);
    await safeGoto(page, '/reports');
    const placeholder = page.getByTestId('reports-disabled');
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText(/Lite Mode/i);
  });
});
