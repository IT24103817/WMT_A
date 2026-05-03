# End-to-End Verification Checklist

Run this against the **deployed Render backend** + the published Expo build (no localhost). If all 15 steps pass, the system is viva-ready.

| # | Step | Expected |
|---|---|---|
| 1 | `POST /api/auth/register` (curl or app) a new customer | 201, returns token + user |
| 2 | Log in as `admin@gemmarket.local` / `<ADMIN_PASSWORD>` | 200, role=admin, app shows admin tabs |
| 3 | Admin → Inventory → add 3 gems (Sapphire 2.4ct, Ruby 1.1ct, Emerald 3.0ct) | All 3 appear with stock=1 |
| 4 | Admin → Articles → publish "All About Sapphires" with cover image | Image URL is `https://res.cloudinary.com/…`; visible to customer |
| 5 | Admin → Listings → create 1 fixed-price (Ruby), 1 negotiable (Sapphire) with photos+video, 1 bid (Emerald, end = +5 min) | All visible to customer |
| 6 | Customer → Marketplace → search "sapphire", open listing, **Make an offer** $1500 | Offer created with status=Pending |
| 7 | Admin → Offers → **Accept** the $1500 offer | Status flips to Accepted; other pending offers on same listing flip to Rejected |
| 8 | Customer → Account → My Offers → tap Accepted offer → Pay with `4242 4242 4242 4242` | Order created; gem stock decremented to 0; listing status=sold |
| 9 | Second customer (new account) → Auctions → place $100, $200 on emerald bid | First two accepted; placing $50 returns 400 ("must be greater than $200") |
| 10 | Wait 5 minutes; refresh Auctions list | Bid auto-closed; winner declared |
| 11 | Winner → Auction detail → Pay $200 with test card | Order created |
| 12 | Admin → Orders → advance both orders Confirmed → Processing → Out for Delivery → Delivered | Status updates each tap |
| 13 | Customer (winner) → Orders → tap delivered order → Leave review (5 stars + comment) | Review appears on the gem's marketplace listing |
| 14 | Customer → Orders → tap a Confirmed order → Cancel | Status flips to Cancelled |
| 15 | Customer → Orders → try to cancel a Delivered/Out-for-Delivery order | 400 "can only be cancelled before processing" |

## Quick API smoke-test (CLI)

```bash
# Backend health
curl -fsS https://gemmarket-api.onrender.com/api/health

# Login
TOKEN=$(curl -s -X POST https://gemmarket-api.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@gemmarket.local","password":"<ADMIN_PASSWORD>"}' | jq -r .token)

# List inventory
curl -fsS https://gemmarket-api.onrender.com/api/inventory \
  -H "Authorization: Bearer $TOKEN" | jq .

# List public marketplace
curl -fsS https://gemmarket-api.onrender.com/api/marketplace | jq '.[] | {gem: .gem.name, price}'

# List bids (also lazy-closes any expired)
curl -fsS https://gemmarket-api.onrender.com/api/bids | jq '.[] | {gem: .gem.name, status, endTime}'
```

## Failure-mode checks (viva "what if" prep)

| Scenario | Expected behaviour |
|---|---|
| Stripe payment fails (mid-amount card error) | 402 returned, no Payment doc saved, no Order, no stock change |
| Two customers buy the same gem at the same time | First wins via `finalizeSale` (listing status check inside transaction); second gets 409 |
| Customer tries to pay for someone else's accepted offer | 403 from `paymentController.charge` (offer ownership check) |
| Customer with no delivered order tries to review | 409 "You can only review delivered orders" |
| Same customer reviews same order twice | 409 (compound unique index `(order, customer)`) |
| JWT tampered with | 401 "Invalid or expired token" from `middleware/auth.js` |
| Customer hits admin-only endpoint | 403 from `middleware/adminOnly.js` |
| Bid placed after `endTime` | 409 "Bidding has ended" |
| Bid placed at exactly the current highest | 400 "Bid must be greater than current highest ($X)" |
