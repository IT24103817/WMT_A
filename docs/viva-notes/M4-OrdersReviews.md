# M4 — Orders + Reviews Module

## Your responsibility
Every successful payment becomes an Order. The customer tracks it through 4 status stages until Delivered, after which they can leave a Review tied to that specific order.

## Files you own
- [backend/models/Order.js](../../backend/models/Order.js)
- [backend/models/Review.js](../../backend/models/Review.js)
- [backend/controllers/orderController.js](../../backend/controllers/orderController.js)
- [backend/controllers/reviewController.js](../../backend/controllers/reviewController.js)
- [backend/routes/orders.js](../../backend/routes/orders.js)
- [backend/routes/reviews.js](../../backend/routes/reviews.js)
- [backend/utils/generateOrderNumber.js](../../backend/utils/generateOrderNumber.js)
- [mobile/src/components/StatusTracker.js](../../mobile/src/components/StatusTracker.js)
- [mobile/src/components/StarRating.js](../../mobile/src/components/StarRating.js)
- [mobile/src/screens/orders/*](../../mobile/src/screens/orders/) — 4 files

You also share `finalizeSale` with M6 — that's where Orders are actually created.

## Order schema
```
{ orderNumber: 'GM-<base36ts>-<RAND>', customer, gem, listing|offer|bid (one set),
  source: 'direct'|'offer'|'bid', amount, payment, status }
status ∈ ['Confirmed','Processing','Out for Delivery','Delivered','Cancelled']
```

## Review schema
```
{ gem, order, customer, rating: 1-5, comment }
```
Compound unique index on `(order, customer)` — one review per order.

## Endpoints
```
GET    /api/orders          token   → mine, sorted newest first
GET    /api/orders/all      admin   → everyone
GET    /api/orders/:id      token   → owner or admin (otherwise 403)
PATCH  /api/orders/:id      admin   { status: <next stage> }
DELETE /api/orders/:id      token   → cancel; customer only while status='Confirmed', admin anytime

GET    /api/reviews/:gemId  public
POST   /api/reviews         customer  { orderId, rating, comment }
DELETE /api/reviews/:id     admin
```

## Authorisation rules (worth memorising)
| Action | Customer | Admin |
|---|---|---|
| List my orders | ✅ | — |
| List all orders | 403 | ✅ |
| View an order | only my own | any |
| Advance status | 403 | ✅ |
| Cancel | only if mine && status='Confirmed' | any |
| Submit review | only if my delivered order | — |
| Delete review | 403 | ✅ |

## Review eligibility check (the important bit)
`reviewController.create` runs **three** checks before saving:
1. Order exists
2. `order.customer === req.user._id` (you can only review your own purchases)
3. `order.status === 'Delivered'` (no pre-delivery reviews)
4. No existing review on `(order, customer)` (the unique index would also catch this)

This is what the brief means by "only customers who actually completed a purchase can leave a review — not anyone who simply browsed the listing."

## Likely viva questions

**Q: Why is `orderNumber` generated in code instead of letting Mongo's `_id` be the customer-facing ID?**
A: ObjectIDs (`507f1f77bcf86cd799439011`) are ugly to read aloud, hard to type for support tickets, and reveal creation timestamps. `GM-AB3KQ7-X4F2` is shorter, brand-prefixed, and uppercase-friendly.

**Q: What if `generateOrderNumber()` collides?**
A: At our volume the collision odds are vanishing (`Date.now()` + 4 random base36 chars). The `unique: true` index on the field means a colliding insert would throw `11000` and our error middleware would surface it. A retry loop in `finalizeSale` would harden it for production.

**Q: Why can't a customer cancel a Delivered order?**
A: It's no longer in their possession to "cancel" — it's been physically delivered. Cancellation logic in `orderController.cancel` rejects with 400 if the customer isn't admin and `status !== 'Confirmed'`. Returns/refunds would be a separate flow.

**Q: How does the StatusTracker render correctly when status='Cancelled'?**
A: Cancelled is outside the linear flow, so the component renders a single red "Order Cancelled" line instead of the four-stage progress bar. See [StatusTracker.js:7-13](../../mobile/src/components/StatusTracker.js).

**Q: How does a customer know an order has advanced?**
A: Polling — the customer's order detail screen calls `useFocusEffect(load)` so every time they open it, it refetches. There's no push notification (out of scope for this assignment), so the assumption is the customer checks back periodically.

## How to demo
1. Trigger a payment (any of the three sources). Verify an Order appears in the customer's Orders tab with status=Confirmed and a unique orderNumber.
2. Tap the order → see the 4-stage StatusTracker, currently with the first dot green.
3. Switch to admin → All Orders → tap **Advance → Processing**.
4. Customer reopens order → tracker now has 2 dots green.
5. Repeat through Delivered.
6. Customer → tap order → **Leave a review** button now appears → submit 5 stars + comment.
7. Customer → Marketplace → open the same gem's listing → review appears at the bottom.
8. Try to cancel a Confirmed order — works. Try to cancel a Delivered order — 400.
