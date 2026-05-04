# GemMarket — Per-Member Component Reference

For each module: **what it does · where the code lives · what's validated · which CRUD operations are wired · the tech-stack pieces involved**.

This is the file your assignment marker will scan to confirm the work split. For viva sample questions, see [`VIVA_CHEATSHEET.md`](VIVA_CHEATSHEET.md).

---

## Stack overview (everyone should know)

| Layer | Tech | Why |
|---|---|---|
| Mobile | **React Native** + **Expo SDK 54** | Single codebase for iOS + Android + web. Expo Go skips native builds entirely. |
| Navigation | `@react-navigation/native` (stack + tabs) | Industry standard for RN. Drives auth-vs-app routing in [`mobile/src/navigation/RootNavigator.js`](mobile/src/navigation/RootNavigator.js) |
| State | React Context + `AsyncStorage` | Auth ([`AuthContext.js`](mobile/src/context/AuthContext.js)) + cart ([`CartContext.js`](mobile/src/context/CartContext.js)). Persisted across reloads. |
| HTTP | `axios` | Single instance in [`mobile/src/api/client.js`](mobile/src/api/client.js) attaches the JWT and translates 4xx/5xx into a `userMessage` field. |
| Animations | `react-native-reanimated` v4 + `Animated.FadeInDown` | Hero animations, list staggers, scroll-driven parallax. |
| Backend | **Node.js + Express** | Single `server.js` mounts all routes; central error middleware catches everything. |
| ORM | `mongoose` 8 | Schemas in [`backend/models/`](backend/models/). Validators run on `.save()`. |
| Database | **MongoDB Atlas** (free M0) | Replica set, supports transactions. |
| Auth | `bcryptjs` + `jsonwebtoken` | Password hashed on register; JWT signed with `JWT_SECRET`, sent in `Authorization: Bearer <token>` header. |
| File uploads | `multer` + `multer-storage-cloudinary` | Streams the upload directly to Cloudinary — Express never touches the bytes. |
| Media CDN | **Cloudinary** | Images + video. URL stored on the doc; the file lives on their CDN. |
| Payments | **Stripe (test mode)** + `@stripe/stripe-react-native` | PaymentIntent created server-side, confirmed with `paymentMethodId` from the SDK. |
| Hosting | **Render** (web service, free tier) | Auto-deploys on `git push`. Sleeps after 15 min idle. |

---

## Group · Authentication

**What it does:** registers customers, logs them in, persists session across app reloads, and gates every other route by JWT.

| Layer | File | What's inside |
|---|---|---|
| Model | [`backend/models/User.js`](backend/models/User.js) | `name`, `email` (unique), `passwordHash`, `role` (`customer`\|`admin`), `lastAddress` (subdoc) |
| Controller | [`backend/controllers/authController.js`](backend/controllers/authController.js) | `register`, `login`, `me` |
| Middleware | [`backend/middleware/auth.js`](backend/middleware/auth.js) | Verifies JWT, loads `req.user` (sets `_id`, `role`, `name`) |
| Middleware | [`backend/middleware/adminOnly.js`](backend/middleware/adminOnly.js) | 403 if `req.user.role !== 'admin'` |
| Routes | [`backend/routes/auth.js`](backend/routes/auth.js) | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Mobile context | [`mobile/src/context/AuthContext.js`](mobile/src/context/AuthContext.js) | Stores `{ user, token }` in `AsyncStorage`; hydrates on app launch; exposes `login`, `logout`, `register` |
| Screens | [`mobile/src/screens/auth/LoginScreen.js`](mobile/src/screens/auth/LoginScreen.js), [`mobile/src/screens/auth/RegisterScreen.js`](mobile/src/screens/auth/RegisterScreen.js) | Forms with client-side validation |
| Navigation | [`mobile/src/navigation/RootNavigator.js`](mobile/src/navigation/RootNavigator.js) | Picks Auth stack vs Customer/Admin tabs based on token presence + role |

**CRUD:** Create (register), Read (me — read own profile), Update/Delete = N/A by design (academic scope).

**Validations:**
- Email is required + valid + unique (`schema.unique` + duplicate-key error mapped to 409)
- Password ≥ 6 chars on register
- `bcrypt.compare` on login; failure returns generic 401 `"Invalid credentials"` (don't leak whether email exists)
- JWT signature verified on every protected request; token expiry honoured

**Stack-specific gotchas:**
- Token is loaded from AsyncStorage in `AuthContext` and attached by the axios interceptor in `client.js`.
- On app reload the user appears logged in even before the network has confirmed — the `me` call refreshes the user; if it 401s, we log them out.

---

## M1 · Inventory (Gem)

**What it does:** admin-only CRUD over the central gem catalog. Every other module joins to a `Gem` document for its specs and photos.

| Layer | File | What's inside |
|---|---|---|
| Model | [`backend/models/Gem.js`](backend/models/Gem.js) | `name`, `type`, `colour`, `carats`, `stockQty`, `isAvailable`, `photos: [String]` (max 6 Cloudinary URLs) |
| Controller | [`backend/controllers/inventoryController.js`](backend/controllers/inventoryController.js) | `list`, `get`, `create`, `update`, `remove` |
| Middleware | [`backend/middleware/upload.js`](backend/middleware/upload.js) | `gemPhotosUpload` — multer + Cloudinary, `array('photos', 6)` |
| Routes | [`backend/routes/inventory.js`](backend/routes/inventory.js) | All routes wrap `auth + adminOnly` |
| Screens | [`mobile/src/screens/inventory/InventoryListScreen.js`](mobile/src/screens/inventory/InventoryListScreen.js), [`mobile/src/screens/inventory/InventoryFormScreen.js`](mobile/src/screens/inventory/InventoryFormScreen.js) | List + form (create/edit) with photo picker (kept vs new differentiation) |

**CRUD:**
- **Create** — `POST /api/inventory` (multipart, optional photos[])
- **Read all** — `GET /api/inventory`
- **Read one** — `GET /api/inventory/:id`
- **Update** — `PUT /api/inventory/:id` (handles photos kept-vs-new)
- **Delete** — `DELETE /api/inventory/:id` (hard delete after confirm)

**Validations:**
- Required: `name`, `type`, `colour`, `carats`, `stockQty`
- `carats > 0`, `stockQty >= 0` (mongoose `min`)
- `isAvailable` auto-derived: `gem.stockQty > 0` (set in pre-save / on stock decrement)
- Max 6 photos; each must be `image/*` MIME (multer `fileFilter`); Cloudinary further restricts to JPG/PNG/HEIC/HEIF/WEBP/AVIF

**Stack-specific gotchas:**
- The `photos` array on the Gem is the **single source of truth** for visuals. Listings, orders, and bids all fall back to it via the helper `mobile/src/utils/photo.js`.
- When `stockQty` is decremented to 0 in `finalizeSale`, the gem is flipped to `isAvailable=false` and the corresponding listing is closed.

---

## M2 · Learning Hub (Article)

**What it does:** admin posts educational articles with cover images; customers browse by category and tap through to detail.

| Layer | File | What's inside |
|---|---|---|
| Model | [`backend/models/Article.js`](backend/models/Article.js) | `title`, `category` (enum: `Gem Types`/`Buying Guide`/`Grading & Quality`/`Care & Maintenance`), `body`, `coverImageUrl`, `publishedAt` |
| Controller | [`backend/controllers/learningController.js`](backend/controllers/learningController.js) | `list` (with optional `?category=`), `get`, `create`, `update`, `remove`, `categories` |
| Middleware | [`backend/middleware/upload.js`](backend/middleware/upload.js) | `articleCoverUpload` — single image |
| Routes | [`backend/routes/learning.js`](backend/routes/learning.js) | Public read, admin write (multipart for cover) |
| Screens | `mobile/src/screens/learning/` | List with category filter chips, detail screen with "View related gems" CTA that prefills marketplace search |

**CRUD:**
- **Create** — `POST /api/learning` (multipart with cover image)
- **Read all** — `GET /api/learning?category=...`
- **Read one** — `GET /api/learning/:id`
- **Update** — `PUT /api/learning/:id`
- **Delete** — `DELETE /api/learning/:id`

**Validations:**
- `title`, `category`, `body` required
- `category` must be one of the 4 enum values (mongoose enum validator)
- Cover image: optional, must be `image/*`, single file (multer `single('cover')`)

---

## M3 · Marketplace + Offers (Listing + Offer)

**What it does:** admin publishes listings (one piece per listing, references a Gem). Customers browse with filters/sort, view detail, add to cart, or — for negotiable listings — submit an offer.

| Layer | File | What's inside |
|---|---|---|
| Models | [`backend/models/Listing.js`](backend/models/Listing.js), [`backend/models/Offer.js`](backend/models/Offer.js) | Listing: `gem` ref, `price`, `description`, `videoUrl`, `openForOffers`, `status` (active/sold/removed). Offer: `listing`, `gem`, `customer`, `amount`, `status` (pending/accepted/rejected/paid) |
| Controllers | [`backend/controllers/marketplaceController.js`](backend/controllers/marketplaceController.js), [`backend/controllers/offerController.js`](backend/controllers/offerController.js) | Marketplace: list/get/create/update/remove + sort modes (newest/price asc/desc/rating). Offers: customer create + list-mine; admin list + accept/reject |
| Routes | [`backend/routes/marketplace.js`](backend/routes/marketplace.js), [`backend/routes/offers.js`](backend/routes/offers.js) | Public read + admin write for marketplace; auth required for offers |
| Mobile | [`mobile/src/context/CartContext.js`](mobile/src/context/CartContext.js), `mobile/src/screens/marketplace/`, `mobile/src/screens/cart/` | Cart in AsyncStorage; sort chips on list; qty stepper capped at `gem.stockQty` |

**CRUD:**

*Listings* — `GET /api/marketplace[?q=&category=&min=&max=&sort=]`, `GET /api/marketplace/:id`, `POST /api/marketplace` (multipart), `PUT /api/marketplace/:id`, `DELETE /api/marketplace/:id` (soft — sets `status='removed'`)

*Offers* — `POST /api/offers`, `GET /api/offers/mine`, `GET /api/offers` (admin), `PATCH /api/offers/:id` (action: accept|reject)

**Validations:**
- Listing: `gemId`, `price`, `description` required; `price >= 0`; `gem.stockQty > 0` enforced on create (`backend/controllers/marketplaceController.js` line ~45)
- Listing status enum: `['active','sold','removed']`
- Offer amount must be a positive number; the offer is rejected if listing is no longer `active` or not `openForOffers`
- Cart qty capped at `gem.stockQty` both client-side (`CartContext.updateQty`) and server-side (`checkoutController.resolveItems`)

**Stack-specific gotchas:**
- Photos live on the **Gem**, not the Listing. The `listingPhoto` / `listingGallery` helpers in `mobile/src/utils/photo.js` fall back gem→listing.
- When an offer is accepted, sibling pending offers stay pending until the customer actually pays — only at payment time does `finalizeSale` reject them. This avoids a deadlock if the customer never returns.

---

## M4 · Orders + Reviews

**What it does:** every successful checkout produces an Order tracked through 4 statuses (Confirmed → Processing → Out for Delivery → Delivered). Once delivered, the customer can post a Review with rating + tags + photos. Admin can reply.

| Layer | File | What's inside |
|---|---|---|
| Models | [`backend/models/Order.js`](backend/models/Order.js), [`backend/models/Review.js`](backend/models/Review.js) | Order: `items[]`, `subtotal`, `shippingFee`, `totalAmount`, `paymentMethod` (card/cod), `shippingAddress` subdoc, `status`, `payment` ref. Review: `gem`, `order`, `customer`, `rating` (1–5), `comment` (≤500), `photos[]` (≤3), `tags[]` (≤3 from 8-enum), `adminReply` subdoc |
| Controllers | [`backend/controllers/orderController.js`](backend/controllers/orderController.js), [`backend/controllers/reviewController.js`](backend/controllers/reviewController.js) | Orders: mine/get/cancel/all/advance/cancelWithRefund. Reviews: byGem (sortable + filterable), aggregate, listAll, mine, sellerStats, tagsList, create, update (30-day window), remove, reply, removeReply |
| Middleware | [`backend/middleware/upload.js`](backend/middleware/upload.js) | `reviewPhotosUpload` — `array('photos', 3)` |
| Mobile | `mobile/src/screens/orders/`, `mobile/src/screens/reviews/` | OrdersScreen / OrderDetail with `StatusTracker` component, ReviewScreen + EditReviewScreen with tag picker + photo lightbox, AdminOrdersScreen with cancel-with-refund + update buttons, AdminReviewsScreen with sort/filter chips + reply |

**CRUD:**

*Orders* — `GET /api/orders` (mine), `GET /api/orders/:id`, `DELETE /api/orders/:id` (cancel pre-dispatch), `POST /api/orders/:id/cancel-refund` (admin), `GET /api/orders/all` (admin), `PATCH /api/orders/:id` (admin advances status)

*Reviews* — `GET /api/reviews/:gemId` (public, with `?sort=&tag=&withPhotos=`), `GET /api/reviews/:gemId/aggregate`, `GET /api/reviews/all` (admin), `GET /api/reviews/mine`, `GET /api/reviews/seller/stats`, `GET /api/reviews/tags/list`, `POST /api/reviews` (multipart, customer), `PUT /api/reviews/:id` (owner only, 30-day window), `DELETE /api/reviews/:id` (owner or admin), `POST /api/reviews/:id/reply` (admin), `DELETE /api/reviews/:id/reply` (admin)

**Validations:**
- Order status enum: `['Confirmed','Processing','Out for Delivery','Delivered','Cancelled']`
- Customer can only cancel while status is `Confirmed` (orderController checks this; otherwise 409)
- Review: rating must be **integer 1–5**; comment 0 chars OR 10–500; **no URLs** (anti-spam regex); **no all-caps** (≥8 letters all uppercase blocked); profanity blocklist; max 3 photos; max 3 tags from the 8 predefined; one review per `(order, customer)` (compound unique index in Mongo)
- Review edit window: 30 days from `createdAt` (otherwise 409)
- Admin reply: 5–300 chars

**Stack-specific gotchas:**
- The `Review` schema has a compound unique index `{ order: 1, customer: 1 }`. Mongo enforces it; trying to double-review yields a duplicate-key error mapped to 409 in the controller.
- Cancel-with-refund (`POST /api/orders/:id/cancel-refund`) walks every item, restores `gem.stockQty`, reopens the listing if it was closed, reverts paid offers, and calls `stripe.refunds.create` for card payments. COD orders skip the Stripe call.

---

## M5 · Bidding (Bid)

**What it does:** admin schedules an auction (now-or-later) with a start price and end time. Customers place increasing bids. When time runs out, the bid auto-closes on the next read (lazy close). The winner can pay through the standard checkout.

| Layer | File | What's inside |
|---|---|---|
| Model | [`backend/models/Bid.js`](backend/models/Bid.js) | `gem`, `startPrice`, `endTime`, `scheduledStartAt`, `description`, `currentHighest: { amount, customer }`, `history[]`, `status` (`scheduled`/`active`/`closed`/`cancelled`), `winner` |
| Controller | [`backend/controllers/bidController.js`](backend/controllers/bidController.js) | `list`, `get`, `create`, `update`, `place`, `remove` — list/get **first call** lazyOpenBids + lazyCloseBids |
| Utils | [`backend/utils/lazyOpenBids.js`](backend/utils/lazyOpenBids.js), [`backend/utils/lazyCloseBids.js`](backend/utils/lazyCloseBids.js) | Sweep: `scheduled` → `active` when `scheduledStartAt <= now`; `active` → `closed` (with `winner = currentHighest.customer`) when `endTime < now` |
| Routes | [`backend/routes/bids.js`](backend/routes/bids.js) | Public list/get; customer place; admin create/update/remove |
| Screens | `mobile/src/screens/bidding/` | BiddingScreen (list with countdown), BidDetailScreen (image gallery + place-bid form + winner pay CTA), BidFormScreen (mode toggle: live now vs scheduled), AdminBidsScreen |

**CRUD:**
- **Create** — `POST /api/bids` (admin)
- **Read all** — `GET /api/bids` (public; sweeps state first)
- **Read one** — `GET /api/bids/:id`
- **Update** — `PUT /api/bids/:id` (admin; description, scheduling)
- **Place bid** — `POST /api/bids/:id/place` (customer)
- **Delete** — `DELETE /api/bids/:id` (admin)

**Validations:**
- `startPrice > 0`, `endTime > now` on create
- Scheduled mode: `scheduledStartAt > now`, `endTime > scheduledStartAt`
- Bid placed: `amount > currentHighest.amount` (or > startPrice if no bids); `now < endTime`; status === `active`
- Status enum: `['scheduled','active','closed','cancelled']`

**Stack-specific gotchas:**
- **Lazy close** is the architectural choice — Render free tier has no scheduled-cron, so we sweep on every read instead. Trade-off documented: a closed bid won't reflect that until someone views it.
- After close, only `bid.winner` can complete the purchase; the checkout endpoint enforces this in `resolveItems`.

---

## M6 · Payment + Cloudinary + Deployment

**What it does:** all three sale paths (cart / accepted offer / won bid) funnel through `/api/checkout`. The controller server-derives the total, calls Stripe (card) or skips (COD), creates a Payment doc, then calls `finalizeSale` to atomically create the Order + decrement stock + close the listing/offer/bid.

This member also owns the **Cloudinary upload pipeline** (used by M2 covers, M1 photos, M4 review photos) and the **Render deployment**.

| Layer | File | What's inside |
|---|---|---|
| Model | [`backend/models/Payment.js`](backend/models/Payment.js) | `customer`, `gem` (legacy primary), `amount`, `stripeRef`, `status` (`pending`/`success`/`failed`/`refunded`), `paymentMethod` (card/cod), `refundRef`, `refundedAt`, `source`, `sourceId` |
| Controllers | [`backend/controllers/checkoutController.js`](backend/controllers/checkoutController.js), [`backend/controllers/paymentController.js`](backend/controllers/paymentController.js) | Checkout: `resolveItems` → Stripe (or skip for COD) → Payment.create → `finalizeSale`. Payment: admin list/get |
| Choke point | [`backend/utils/finalizeSale.js`](backend/utils/finalizeSale.js) | For each item: validate source, mark listing/offer/bid, decrement gem stock by `qty`, reject sibling pending offers, close listing if stock depleted (or always for offer/bid). Then create one `Order` |
| Cloudinary config | [`backend/config/cloudinary.js`](backend/config/cloudinary.js) | `cloudinary.config()` from env vars |
| Upload middleware | [`backend/middleware/upload.js`](backend/middleware/upload.js) | 4 instances: `articleCoverUpload`, `listingMediaUpload` (video), `gemPhotosUpload` (≤6), `reviewPhotosUpload` (≤3) |
| Routes | [`backend/routes/checkout.js`](backend/routes/checkout.js), [`backend/routes/payments.js`](backend/routes/payments.js) | Customer checkout, admin payment list |
| Mobile | `mobile/src/screens/cart/`, `mobile/src/screens/payment/` | CartScreen with qty stepper, CheckoutScreen with address form + payment-method selector, PaymentScreen with Stripe `<CardField>` and Confetti on success |

**CRUD:**

*Checkout* — `POST /api/checkout` (only Create — it's the orchestrator)

*Payments* — `GET /api/payments` (admin list), `GET /api/payments/:id` (admin)

**Validations:**
- `paymentMethod` must be `'card'` or `'cod'`
- Card path requires `paymentMethodId` (from Stripe SDK)
- `shippingAddress` requires `fullName`, `phone`, `line1`, `city`, `postalCode`, `country` (server-side `validateAddress`)
- Cart qty validated against `gem.stockQty` per item
- Offer source: must belong to user, must be `accepted`
- Bid source: must be `closed`, user must equal `winner`
- All amounts are server-derived — the client never sets `totalAmount`

**Stack-specific gotchas:**
- **No card data ever touches our DB.** The mobile SDK creates a `paymentMethod` on Stripe's side; we only see the opaque ID.
- `finalizeSale` is wrapped in try/catch — if anything fails after the Stripe charge succeeded, we mark the Payment as `failed` and rethrow. The PaymentIntent stays charged on Stripe; refund is the recovery path. (Mongoose transactions could make this tighter — documented as a known trade-off.)
- The Cloudinary multer storage streams the file directly to Cloudinary; Express never buffers it on disk. The doc only ever stores the resulting `secure_url`.

**Deployment:**
- Render web service · Root `backend/` · Build `npm install --legacy-peer-deps` · Start `node server.js`
- Atlas IP allow-list set to `0.0.0.0/0` (academic project)
- Auto-deploys on `git push origin main`
- Free tier sleeps after 15 min idle — first request after sleep takes ~30s

---

## Cross-cutting / shared

| File | Used by | Note |
|---|---|---|
| [`backend/middleware/errorHandler.js`](backend/middleware/errorHandler.js) | every route | Maps mongoose validation errors → 400, duplicate-key → 409, JWT errors → 401, anything else → 500 |
| [`backend/utils/generateOrderNumber.js`](backend/utils/generateOrderNumber.js) | `finalizeSale` | Produces a human-friendly `ORD-XXXXXX` |
| [`backend/scripts/seedAdmin.js`](backend/scripts/seedAdmin.js) | once-off | Upserts `admin@gemmarket.local` from env vars |
| [`backend/scripts/seedDemo.js`](backend/scripts/seedDemo.js) | optional | 2 customers + 4 gems with photos + sample delivered orders + 4 reviews. Idempotent. |
| [`mobile/src/api/client.js`](mobile/src/api/client.js) | every screen | Axios instance, attaches JWT, normalises errors into `e.userMessage` |
| [`mobile/src/utils/photo.js`](mobile/src/utils/photo.js) | M3, M4, M5 | `listingPhoto(listing)` falls back gem→listing; `listingGallery` merges both |
| [`mobile/src/utils/upload.js`](mobile/src/utils/upload.js) | every multipart screen | `pickerAssetToFile` infers MIME from URI on iOS HEIC |
| [`mobile/src/components/`](mobile/src/components/) | every screen | Reusable UI: Button, Card, Input, GradientButton, Toast, Skeleton, StarRating, StatusTracker, CountdownTimer, GemPicker, TagPicker, PhotoLightbox, Confetti |
