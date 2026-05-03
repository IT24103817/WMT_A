const { test, expect } = require('@playwright/test');
const { uniqueEmail, registerCustomer } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');

test.describe('Seller Profile', () => {
  test('customer can open Visit the Atelier from Account', async ({ page }) => {
    const email = await uniqueEmail('atelier');
    await registerCustomer('Atelier Visitor', email, 'passw0rd');
    await login(page, email, 'passw0rd');

    await clickTab(page, 'Account');
    await page.getByText('Visit the Atelier').click();
    await expect(page.getByText('GemMarket Atelier')).toBeVisible({ timeout: 10_000 });
  });
});
