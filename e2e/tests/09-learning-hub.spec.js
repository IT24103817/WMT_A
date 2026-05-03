const { test, expect } = require('@playwright/test');
const { ADMIN, uniqueEmail, registerCustomer } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');

test.describe('Learning Hub', () => {
  test('customer can browse Learn tab + filter chips render', async ({ page }) => {
    const email = await uniqueEmail('learn');
    await registerCustomer('Learner', email, 'passw0rd');
    await login(page, email, 'passw0rd');

    await clickTab(page, 'Learn');
    await expect(page.getByText('Learning Hub')).toBeVisible();
    await expect(page.getByText('All', { exact: true })).toBeVisible();
    // Category chips from the API enum
    await expect(page.getByText('Gem Types', { exact: true })).toBeVisible();
    await expect(page.getByText('Buying Guide', { exact: true })).toBeVisible();
  });

  test('admin can navigate Articles tab and open the new-article form', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await clickTab(page, 'Articles');
    await expect(page.getByText('Articles', { exact: true }).first()).toBeVisible();
    await page.getByText('New', { exact: true }).first().click();
    await expect(page.getByText('Publish article')).toBeVisible({ timeout: 8_000 });
  });
});
