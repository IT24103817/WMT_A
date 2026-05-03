# API Reference (with examples)

Base URL (dev): `http://localhost:5000`
Base URL (prod): `https://gemmarket-api.onrender.com`

All non-public endpoints require `Authorization: Bearer <jwt>`. Multipart endpoints accept `multipart/form-data` with the field names noted.

## Auth

### POST /api/auth/register
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```
→ `201 { token, user }`

### POST /api/auth/login
```json
{ "email": "alice@example.com", "password": "secret123" }
```
→ `200 { token, user }`  ·  `401` on bad creds

### GET /api/auth/me
→ `200 { user }`

## Inventory (admin)

```
GET    /api/inventory        → [Gem]
GET    /api/inventory/:id    → Gem
POST   /api/inventory        → Gem      { name, type, colour, carats, stockQty? }
PUT    /api/inventory/:id    → Gem      (any subset of fields)
DELETE /api/inventory/:id    → { ok: true }
```

## Learning Hub

```
GET    /api/learning/categories            → ["Gem Types", "Buying Guide", …]
GET    /api/learning?category=Gem%20Types  → [Article]
GET    /api/learning/:id                   → Article
POST   /api/learning   (admin, multipart)  → Article
       fields: title, category, body, cover (file)
PUT    /api/learning/:id (admin, multipart) → Article
DELETE /api/learning/:id (admin)           → { ok: true }
```

## Marketplace

```
GET    /api/marketplace?q=&category=&type=&min=&max=  → [Listing populated with gem]
GET    /api/marketplace/:id                            → Listing
POST   /api/marketplace   (admin, multipart)           → Listing
       fields: gemId, price, description, openForOffers, photos[] (≤6), video?
PUT    /api/marketplace/:id (admin, multipart)         → Listing  (appends new photos, replaces video)
DELETE /api/marketplace/:id (admin)                    → { ok: true }  (soft-delete: status=removed)
```

## Offers

```
POST   /api/offers   (customer)        { listingId, amount }   → Offer
GET    /api/offers/mine (customer)     → [Offer]
GET    /api/offers   (admin)           → [Offer with customer + listing populated]
PATCH  /api/offers/:id (admin)         { action: "accept"|"reject" } → Offer
```

Accepting an offer auto-rejects all other pending offers on the same listing.

## Bids

```
GET    /api/bids                  → [Bid]   (sweeps expired auctions first)
GET    /api/bids/:id              → Bid     (with history populated)
POST   /api/bids   (admin)        { gemId, startPrice, endTime } → Bid
DELETE /api/bids/:id (admin)      → { ok: true } (soft-cancel; closed bids cannot be deleted)
POST   /api/bids/:id/place (customer)  { amount } → Bid
       400 if amount ≤ current highest, 409 if auction ended
```

## Orders

```
GET    /api/orders         (token)   → [Order]   (only mine)
GET    /api/orders/all     (admin)   → [Order]
GET    /api/orders/:id     (token)   → Order     (owner or admin)
PATCH  /api/orders/:id     (admin)   { status: "Processing"|"Out for Delivery"|"Delivered"|"Cancelled" }
DELETE /api/orders/:id     (token)   → Order     (sets status='Cancelled'; customer can only cancel while 'Confirmed')
```

## Reviews

```
GET    /api/reviews/:gemId             → [Review]
POST   /api/reviews   (customer)       { orderId, rating, comment? }
       409 if order not delivered, 409 if already reviewed
DELETE /api/reviews/:id (admin)        → { ok: true }
```

## Payments

```
POST   /api/payments   (customer)
{
  "source": "direct" | "offer" | "bid",
  "sourceId": "<listing|offer|bid id>",
  "paymentMethodId": "pm_…"  // from Stripe createPaymentMethod
}
→ 201 { payment, order }
→ 402 { error } on Stripe failure
```

The amount is **server-derived** from the listing/offer/bid record — clients can't tamper with the price by changing the body.

```
GET    /api/payments      (admin)   → [Payment]
GET    /api/payments/:id  (admin)   → Payment
```

## Errors

All errors are JSON of the form `{ "error": "human readable message" }`. Status codes follow REST conventions:
- `400` validation
- `401` missing / invalid token
- `403` wrong role / not your resource
- `404` not found
- `409` state conflict (e.g. listing already sold, offer already decided)
- `402` payment failed
- `500` server error
