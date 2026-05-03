/**
 * Page-Object-style helpers for the Expo web build.
 *
 * React Native Web renders RN components into divs, so most components
 * don't have stable test IDs unless we add them. We rely on visible text
 * for navigation, which matches what a human would see in the demo.
 */
const { expect } = require('@playwright/test');

async function login(page, email, password) {
  await page.goto('/');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByText('Log in', { exact: true }).click();
  // Wait for either tab bar (logged in) or an error toast
  await expect(page.getByText(/Account|Inventory|Marketplace|Home/i).first()).toBeVisible({ timeout: 15_000 });
}

async function logout(page) {
  // Navigate to account tab and tap log out (text appears on AccountScreen).
  // Tab bar uses ☺ icon; click by accessibility label "Account" or "Me".
  await Promise.race([
    page.getByText('Account', { exact: true }).click().catch(() => {}),
    page.getByText('Me', { exact: true }).click().catch(() => {}),
  ]);
  await page.getByText('Log out').click();
}

async function clickTab(page, label) {
  await page.getByText(label, { exact: true }).first().click();
}

module.exports = { login, logout, clickTab };
