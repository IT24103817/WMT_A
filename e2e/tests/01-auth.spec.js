const { test, expect } = require('@playwright/test');
const { ADMIN, registerCustomer, uniqueEmail } = require('../utils/api');
const { login } = require('../utils/ui');

test.describe('Auth', () => {
  test('admin can log in and sees admin tabs', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    // Admin tab bar contains Inventory + Listings + Offers + Reviews + Pay
    await expect(page.getByText('Inventory', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Reviews', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Pay', { exact: true }).first()).toBeVisible();
  });

  test('customer registration flow', async ({ page }) => {
    const email = await uniqueEmail('register');
    await page.goto('/');
    await page.getByText('Create an account').click();
    await page.getByPlaceholder('Jane Cartier').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill(email);
    const passwords = page.getByPlaceholder(/At least 6 characters|Re-enter password/);
    await passwords.nth(0).fill('passw0rd');
    await passwords.nth(1).fill('passw0rd');
    await page.getByText('Create account', { exact: true }).click();
    // Customer lands on Home
    await expect(page.getByText(/Welcome|Discover|Home/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('login validation rejects bad credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('you@example.com').fill('nobody@nowhere.com');
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByText('Log in', { exact: true }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible({ timeout: 8_000 });
  });
});
