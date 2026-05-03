const { test, expect } = require('@playwright/test');
const { ADMIN } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');

test.describe('Inventory CRUD', () => {
  test('admin can add, edit and delete a gem', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await clickTab(page, 'Inventory');

    // Add
    await page.getByText('Add', { exact: true }).first().click();
    const uniqueName = `PW Test Gem ${Date.now()}`;
    await page.getByPlaceholder('Royal Sapphire').fill(uniqueName);
    await page.getByPlaceholder('Sapphire / Ruby / Emerald').fill('Sapphire');
    await page.getByPlaceholder('Royal blue').fill('Indigo');
    await page.getByPlaceholder('2.4').fill('1.8');
    await page.getByText('Add gem').click();
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10_000 });

    // Edit
    await page
      .locator('div')
      .filter({ hasText: new RegExp(`^${uniqueName}`) })
      .first()
      .locator('text=Edit')
      .first()
      .click();
    await page.getByPlaceholder('2.4').fill('2.1');
    await page.getByText('Save changes').click();
    await expect(page.getByText('2.1ct')).toBeVisible({ timeout: 8_000 });

    // Delete
    await page
      .locator('div')
      .filter({ hasText: new RegExp(`^${uniqueName}`) })
      .first()
      .locator('text=Delete')
      .first()
      .click();
    await expect(page.getByText(uniqueName)).toBeHidden({ timeout: 8_000 });
  });
});
