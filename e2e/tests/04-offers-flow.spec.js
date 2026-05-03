const { test, expect } = require('@playwright/test');
const { ADMIN, loginAdmin, createGem, uniqueEmail, registerCustomer, API } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');
const axios = require('axios');
const FormData = require('form-data');

test.describe('Offer + Negotiation flow', () => {
  test('customer submits offer; admin accepts; offer appears in My Offers', async ({ page }) => {
    const adminToken = await loginAdmin();
    const gem = await createGem(adminToken, { name: `Negotiable Gem ${Date.now()}` });

    const fd = new FormData();
    fd.append('gemId', gem._id);
    fd.append('price', '5000');
    fd.append('description', 'Open for negotiation test gem');
    fd.append('openForOffers', 'true');
    fd.append('photos', Buffer.from('ffd8ffd9', 'hex'), { filename: 'p.jpg', contentType: 'image/jpeg' });
    const { data: listing } = await axios.post(`${API}/api/marketplace`, fd, {
      headers: { ...fd.getHeaders(), Authorization: `Bearer ${adminToken}` },
    });

    // Customer signs up + offers
    const email = await uniqueEmail('offer');
    const { token: custToken } = await registerCustomer('Offer Tester', email, 'passw0rd');
    await axios.post(`${API}/api/offers`, { listingId: listing._id, amount: 4200 }, {
      headers: { Authorization: `Bearer ${custToken}` },
    });

    // Admin logs in via UI and accepts
    await login(page, ADMIN.email, ADMIN.password);
    await clickTab(page, 'Offers');
    await expect(page.getByText(gem.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText('Accept', { exact: true }).first().click();
    await expect(page.getByText(/accepted/i).first()).toBeVisible({ timeout: 8_000 });

    // Customer logs in + sees their accepted offer in My Offers
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await login(page, email, 'passw0rd');
    await clickTab(page, 'Account');
    await page.getByText('My Offers').click();
    await expect(page.getByText(gem.name)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/accepted/i).first()).toBeVisible();
    await expect(page.getByText(/Pay/i)).toBeVisible();
  });
});
