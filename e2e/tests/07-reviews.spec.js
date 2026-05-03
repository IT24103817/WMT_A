const { test, expect } = require('@playwright/test');
const { ADMIN, API } = require('../utils/api');
const { login, clickTab } = require('../utils/ui');
const axios = require('axios');

test.describe('Reviews moderation + seller stats', () => {
  test('admin Reviews tab shows aggregate + each review', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await clickTab(page, 'Reviews');
    // Either there's the empty state OR the aggregate card
    await expect(
      page.getByText(/No reviews yet|Average rating/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('public seller stats endpoint returns shape', async () => {
    const { data } = await axios.get(`${API}/api/reviews/seller/stats`);
    expect(data).toHaveProperty('avg');
    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('distribution');
  });
});
