const { test, expect } = require('@playwright/test');
const { ADMIN, loginAdmin, createGem, uniqueEmail, registerCustomer, API } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');
const axios = require('axios');

test.describe('Bidding', () => {
  test('admin creates auction, customer places bid, second bid must exceed', async ({ page }) => {
    const adminToken = await loginAdmin();
    const gem = await createGem(adminToken, { name: `Auction Gem ${Date.now()}` });

    const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data: bid } = await axios.post(
      `${API}/api/bids`,
      { gemId: gem._id, startPrice: 100, endTime },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const email = await uniqueEmail('bid');
    const { token } = await registerCustomer('Bidder', email, 'passw0rd');

    // valid bid
    await axios.post(
      `${API}/api/bids/${bid._id}/place`,
      { amount: 200 },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // invalid bid (lower) → 400
    let lowError;
    try {
      await axios.post(
        `${API}/api/bids/${bid._id}/place`,
        { amount: 150 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) { lowError = e.response; }
    expect(lowError.status).toBe(400);

    // UI: customer sees the bid in Auctions tab with their highest mark
    await login(page, email, 'passw0rd');
    await clickTab(page, 'Auctions');
    await expect(page.getByText(gem.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText(gem.name).first().click();
    await expect(page.getByText(/200/)).toBeVisible();
    await expect(page.getByText(/by you/i)).toBeVisible();
  });
});
