const { test, expect } = require('@playwright/test');
const { ADMIN } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');

test.describe('Admin Payments overview', () => {
  test('admin can view payments tab with KPIs', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await clickTab(page, 'Pay');
    await expect(page.getByText('Total revenue')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Successful')).toBeVisible();
  });
});
