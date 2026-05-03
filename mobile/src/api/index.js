import client from './client';

export const auth = {
  register: (data) => client.post('/api/auth/register', data).then((r) => r.data),
  login: (data) => client.post('/api/auth/login', data).then((r) => r.data),
  me: () => client.get('/api/auth/me').then((r) => r.data),
};

export const inventory = {
  list: () => client.get('/api/inventory').then((r) => r.data),
  get: (id) => client.get(`/api/inventory/${id}`).then((r) => r.data),
  create: (data) => client.post('/api/inventory', data).then((r) => r.data),
  update: (id, data) => client.put(`/api/inventory/${id}`, data).then((r) => r.data),
  remove: (id) => client.delete(`/api/inventory/${id}`).then((r) => r.data),
};

export const learning = {
  categories: () => client.get('/api/learning/categories').then((r) => r.data),
  list: (category) =>
    client
      .get('/api/learning', { params: category ? { category } : {} })
      .then((r) => r.data),
  get: (id) => client.get(`/api/learning/${id}`).then((r) => r.data),
  // NB: do NOT set Content-Type for FormData. React Native + axios will compute the
  // multipart boundary automatically; an explicit "multipart/form-data" without a
  // boundary causes file fields to silently drop on iOS while text fields go through.
  create: (formData) => client.post('/api/learning', formData).then((r) => r.data),
  update: (id, formData) => client.put(`/api/learning/${id}`, formData).then((r) => r.data),
  remove: (id) => client.delete(`/api/learning/${id}`).then((r) => r.data),
};

export const marketplace = {
  list: (params) => client.get('/api/marketplace', { params }).then((r) => r.data),
  get: (id) => client.get(`/api/marketplace/${id}`).then((r) => r.data),
  create: (formData) => client.post('/api/marketplace', formData).then((r) => r.data),
  update: (id, formData) => client.put(`/api/marketplace/${id}`, formData).then((r) => r.data),
  remove: (id) => client.delete(`/api/marketplace/${id}`).then((r) => r.data),
};

export const offers = {
  create: (data) => client.post('/api/offers', data).then((r) => r.data),
  mine: () => client.get('/api/offers/mine').then((r) => r.data),
  listAll: () => client.get('/api/offers').then((r) => r.data),
  decide: (id, action) => client.patch(`/api/offers/${id}`, { action }).then((r) => r.data),
};

export const bids = {
  list: () => client.get('/api/bids').then((r) => r.data),
  get: (id) => client.get(`/api/bids/${id}`).then((r) => r.data),
  create: (data) => client.post('/api/bids', data).then((r) => r.data),
  place: (id, amount) => client.post(`/api/bids/${id}/place`, { amount }).then((r) => r.data),
  remove: (id) => client.delete(`/api/bids/${id}`).then((r) => r.data),
};

export const orders = {
  mine: () => client.get('/api/orders').then((r) => r.data),
  get: (id) => client.get(`/api/orders/${id}`).then((r) => r.data),
  listAll: () => client.get('/api/orders/all').then((r) => r.data),
  advance: (id, status) => client.patch(`/api/orders/${id}`, { status }).then((r) => r.data),
  cancel: (id) => client.delete(`/api/orders/${id}`).then((r) => r.data),
  cancelWithRefund: (id) => client.post(`/api/orders/${id}/cancel-refund`).then((r) => r.data),
};

export const reviews = {
  byGem: (gemId, params) => client.get(`/api/reviews/${gemId}`, { params }).then((r) => r.data),
  aggregate: (gemId) => client.get(`/api/reviews/${gemId}/aggregate`).then((r) => r.data),
  listAll: () => client.get('/api/reviews/all').then((r) => r.data),
  mine: () => client.get('/api/reviews/mine').then((r) => r.data),
  sellerStats: () => client.get('/api/reviews/seller/stats').then((r) => r.data),
  tagsList: () => client.get('/api/reviews/tags/list').then((r) => r.data),
  create: (formData) => client.post('/api/reviews', formData).then((r) => r.data),
  update: (id, formData) => client.put(`/api/reviews/${id}`, formData).then((r) => r.data),
  remove: (id) => client.delete(`/api/reviews/${id}`).then((r) => r.data),
  reply: (id, text) => client.post(`/api/reviews/${id}/reply`, { text }).then((r) => r.data),
  removeReply: (id) => client.delete(`/api/reviews/${id}/reply`).then((r) => r.data),
};

export const payments = {
  charge: (data) => client.post('/api/payments', data).then((r) => r.data),
  list: () => client.get('/api/payments').then((r) => r.data),
  get: (id) => client.get(`/api/payments/${id}`).then((r) => r.data),
};
