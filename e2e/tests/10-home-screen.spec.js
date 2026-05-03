const { test, expect } = require('@playwright/test');
const { uniqueEmail, registerCustomer } = require('../utils/api');
const { login } = require('../utils/ui');

test.describe('Customer Home screen', () => {
  test('home shows hero, featured section header, learn section', async ({ page }) => {
    const email = await uniqueEmail('home');
    await registerCustomer('Home Tester', email, 'passw0rd');
    await login(page, email, 'passw0rd');

    // Hero CTA + section headers
    await expect(page.getByText(/Discover rare gems|Browse marketplace/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Featured gems')).toBeVisible();
    await expect(page.getByText('Learn the craft').or(page.getByText('Ending soon'))).toBeVisible();
  });
});
