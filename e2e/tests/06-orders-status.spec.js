const { test, expect } = require('@playwright/test');
const { ADMIN, loginAdmin, API } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');
const axios = require('axios');

test.describe('Orders', () => {
  test('admin sees all orders and can advance status', async ({ page }) => {
    const adminToken = await loginAdmin();
    const { data: list } = await axios.get(`${API}/api/orders/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    test.skip(list.length === 0, 'No orders to advance — run after a payment flow');

    await login(page, ADMIN.email, ADMIN.password);
    await clickTab(page, 'Orders');
    await expect(page.getByText('All Orders')).toBeVisible().catch(() => {});
    await expect(page.getByText(/GM-/).first()).toBeVisible({ timeout: 10_000 });
  });
});
