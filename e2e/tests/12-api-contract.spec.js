/**
 * Contract tests — exercise the API directly so failures isolate
 * "is this a UI issue or a backend issue?"
 */
const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { ADMIN, API, loginAdmin, uniqueEmail } = require('../utils/api');

test.describe('API contract', () => {
  test('GET /api/health returns ok', async () => {
    const { data } = await axios.get(`${API}/api/health`);
    expect(data.status).toBe('ok');
  });

  test('register → me returns user with token', async () => {
    const email = await uniqueEmail('contract');
    const { data: reg } = await axios.post(`${API}/api/auth/register`, {
      name: 'Contract', email, password: 'passw0rd',
    });
    expect(reg.token).toBeTruthy();
    const { data: me } = await axios.get(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${reg.token}` },
    });
    expect(me.user.email).toBe(email);
    expect(me.user.role).toBe('customer');
  });

  test('admin login + listing inventory works', async () => {
    const token = await loginAdmin();
    const { data } = await axios.get(`${API}/api/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(Array.isArray(data)).toBe(true);
  });

  test('inventory rejected for customer', async () => {
    const email = await uniqueEmail('cust');
    const { data: reg } = await axios.post(`${API}/api/auth/register`, {
      name: 'Cust', email, password: 'passw0rd',
    });
    let err;
    try {
      await axios.get(`${API}/api/inventory`, { headers: { Authorization: `Bearer ${reg.token}` } });
    } catch (e) { err = e.response; }
    expect(err.status).toBe(403);
  });

  test('public marketplace + bids endpoints', async () => {
    const m = await axios.get(`${API}/api/marketplace`);
    const b = await axios.get(`${API}/api/bids`);
    const learn = await axios.get(`${API}/api/learning`);
    expect(Array.isArray(m.data)).toBe(true);
    expect(Array.isArray(b.data)).toBe(true);
    expect(Array.isArray(learn.data)).toBe(true);
  });

  test('learning categories enum stable', async () => {
    const { data } = await axios.get(`${API}/api/learning/categories`);
    expect(data).toEqual([
      'Gem Types', 'Buying Guide', 'Grading & Quality', 'Care & Maintenance',
    ]);
  });

  test('seller stats shape', async () => {
    const { data } = await axios.get(`${API}/api/reviews/seller/stats`);
    expect(data).toHaveProperty('avg');
    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('distribution');
    expect(data.distribution).toHaveProperty('5');
  });
});
