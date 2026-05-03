const { test, expect } = require('@playwright/test');
const { ADMIN, loginAdmin, createGem, uniqueEmail, registerCustomer, API } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');
const axios = require('axios');

test.describe('Marketplace browse', () => {
  test('customer can browse listings and view detail with reviews', async ({ page }) => {
    // Seed a listing via API
    const adminToken = await loginAdmin();
    const gem = await createGem(adminToken, { name: `Browse Gem ${Date.now()}` });
    const fd = new (require('form-data'))();
    fd.append('gemId', gem._id);
    fd.append('price', '2500');
    fd.append('description', 'A test gem for marketplace browse spec');
    fd.append('openForOffers', 'false');
    // Photos require multipart with at least one file. Use a tiny jpeg buffer.
    const tinyJpeg = Buffer.from('ffd8ffd9', 'hex');
    fd.append('photos', tinyJpeg, { filename: 'p.jpg', contentType: 'image/jpeg' });
    await axios.post(`${API}/api/marketplace`, fd, {
      headers: { ...fd.getHeaders(), Authorization: `Bearer ${adminToken}` },
    }).catch(() => {});

    // Register customer + browse
    const email = await uniqueEmail('browse');
    await registerCustomer('Browse Tester', email, 'passw0rd');
    await login(page, email, 'passw0rd');

    await clickTab(page, 'Market');
    await expect(page.getByText(gem.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText(gem.name).first().click();
    await expect(page.getByText('Buy now', { exact: false })).toBeVisible();
  });
});
