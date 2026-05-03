/**
 * Backend helpers used by Playwright specs to seed/query state directly,
 * so we don't have to drive the UI for setup.
 */
const axios = require('axios');

const API = process.env.E2E_API_URL || 'http://localhost:5000';

const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@gemmarket.local',
  password: process.env.ADMIN_PASSWORD || 'ChangeMe!2026',
};

async function loginAdmin() {
  const { data } = await axios.post(`${API}/api/auth/login`, ADMIN);
  return data.token;
}

async function loginAs(email, password) {
  const { data } = await axios.post(`${API}/api/auth/login`, { email, password });
  return { token: data.token, user: data.user };
}

async function registerCustomer(name, email, password) {
  const { data } = await axios.post(`${API}/api/auth/register`, { name, email, password });
  return { token: data.token, user: data.user };
}

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

async function createGem(token, fields) {
  const payload = {
    name: 'Royal Sapphire',
    type: 'Sapphire',
    colour: 'Royal Blue',
    carats: 2.4,
    stockQty: 5,
    ...fields,
  };
  const { data } = await axios.post(`${API}/api/inventory`, payload, auth(token));
  return data;
}

async function deleteGem(token, id) {
  await axios.delete(`${API}/api/inventory/${id}`, auth(token));
}

async function listInventory(token) {
  const { data } = await axios.get(`${API}/api/inventory`, auth(token));
  return data;
}

async function clearInventory(token) {
  const list = await listInventory(token);
  for (const g of list) await deleteGem(token, g._id);
}

async function uniqueEmail(prefix = 'pw') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}

module.exports = {
  API,
  ADMIN,
  loginAdmin,
  loginAs,
  registerCustomer,
  createGem,
  deleteGem,
  listInventory,
  clearInventory,
  uniqueEmail,
  auth,
};
