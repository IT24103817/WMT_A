# Your Component — A Simple Guide

This document is written **as if you are explaining it to a friend who has never seen the code**. For each module, you will find:

- **What it is** (in 1 sentence)
- **What you can do with it** — every Create / Read / Update / Delete operation, what each one does, and which file holds it
- **What's checked** — every validation rule, in plain words
- **Where to look in the code** — exact file paths so you can open them in VS Code

> Every important file in the codebase now has a comment block at the top explaining what it does. Open any file from the table below and the first 10–30 lines will tell you the same things this doc summarises.

For viva questions and answers see [`VIVA_CHEATSHEET.md`](VIVA_CHEATSHEET.md).
For setup instructions for your team see [`RUN_LOCALLY.md`](RUN_LOCALLY.md).

---

## How the system fits together (2-minute version)

1. **Mobile app (React Native + Expo)** runs on the phone. Every screen is a React component in `mobile/src/screens/`.
2. The app calls our **backend API (Node + Express)** at `https://wmt-a.onrender.com`. All API code is in `backend/`.
3. The backend talks to **MongoDB Atlas** (the database) and to **Cloudinary** (where images live) and **Stripe** (for card payments).
4. When a user logs in, the backend gives them a **JWT token**. The mobile app keeps it in `AsyncStorage` and sends it on every request.

That's the whole picture. Every module below is just a different feature using the same pipes.

---

## Group · Authentication

**What it is:** the login system. Lets people register, log in, and stay logged in across app reloads.

### What you can do with it

| Operation | Meaning | Where the code is |
|---|---|---|
| **CREATE (register)** | Make a new customer account | [`backend/controllers/authController.js`](backend/controllers/authController.js) → `register` |
| **READ (login)** | Check email + password and give back a token | `authController.js` → `login` |
| **READ (me)** | Tell the app who is currently logged in | `authController.js` → `me` |

> There is no Update or Delete for users in this scope — accounts cannot be edited or deleted by design (academic project).

### What's checked

When **registering**:
- name, email, password are all **required**
- password must be **at least 6 characters**
- email cannot be **already in use** (the database has a unique rule)

When **logging in**:
- email + password are **required**
- if either is wrong, you get a generic message "Invalid credentials" — we don't say "wrong email" vs "wrong password" because that helps attackers guess valid emails

The token is signed with a secret (`JWT_SECRET`) so nobody can fake one.

### Where the files are

| File | What it does |
|---|---|
| [`backend/models/User.js`](backend/models/User.js) | The User shape: name, email, passwordHash, role, lastAddress |
| [`backend/controllers/authController.js`](backend/controllers/authController.js) | register / login / me |
| [`backend/middleware/auth.js`](backend/middleware/auth.js) | Reads the token on every protected request |
| [`backend/middleware/adminOnly.js`](backend/middleware/adminOnly.js) | Adds an admin check on top of auth |
| [`backend/routes/auth.js`](backend/routes/auth.js) | Connects the URLs to the functions |
| [`mobile/src/context/AuthContext.js`](mobile/src/context/AuthContext.js) | Keeps user + token in memory + AsyncStorage |
| [`mobile/src/screens/auth/LoginScreen.js`](mobile/src/screens/auth/LoginScreen.js) | The login form |
| [`mobile/src/screens/auth/RegisterScreen.js`](mobile/src/screens/auth/RegisterScreen.js) | The signup form |
| [`mobile/src/navigation/RootNavigator.js`](mobile/src/navigation/RootNavigator.js) | Decides Auth vs Customer vs Admin tabs |

---

## M1 · Inventory (Gem)

**What it is:** the **catalog**. Every gem in the shop lives here. Listings, bids and orders all point at one of these gems.

### What you can do with it

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **CREATE** | Add a new gem with photos | `POST /api/inventory` | [`inventoryController.js`](backend/controllers/inventoryController.js) → `create` |
| **READ all** | List every gem | `GET /api/inventory` | `inventoryController.js` → `list` |
| **READ one** | Get a single gem | `GET /api/inventory/:id` | `inventoryController.js` → `get` |
| **UPDATE** | Edit name / type / colour / carats / stock / photos | `PUT /api/inventory/:id` | `inventoryController.js` → `update` |
| **DELETE** | Remove a gem permanently | `DELETE /api/inventory/:id` | `inventoryController.js` → `remove` |

All five are **admin-only** — the route file wraps them with `auth + adminOnly` middleware.

### What's checked

When creating or updating:
- **name, type, colour** are required
- **carats** must be a number ≥ 0
- **stockQty** must be ≥ 0 (defaults to 1)
- You can attach **up to 6 photos**, each must be an image file (JPG / PNG / HEIC / WEBP / etc.) and **≤ 25 MB**
- `isAvailable` is set automatically: true if `stockQty > 0`, false otherwise

### Where the files are

| File | What it does |
|---|---|
| [`backend/models/Gem.js`](backend/models/Gem.js) | The Gem shape + auto `isAvailable` rule |
| [`backend/controllers/inventoryController.js`](backend/controllers/inventoryController.js) | All 5 CRUD operations |
| [`backend/routes/inventory.js`](backend/routes/inventory.js) | Connects URLs to functions |
| [`backend/middleware/upload.js`](backend/middleware/upload.js) | `gemPhotosUpload` — handles the 6 photo upload |
| [`mobile/src/screens/inventory/AdminInventoryScreen.js`](mobile/src/screens/inventory/AdminInventoryScreen.js) | The list view |
| [`mobile/src/screens/inventory/InventoryFormScreen.js`](mobile/src/screens/inventory/InventoryFormScreen.js) | The create/edit form |

---

## M2 · Learning Hub (Article)

**What it is:** educational articles like "How to buy a sapphire". Customers can read; admin can publish.

### What you can do with it

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **CREATE** | Publish an article with a cover image | `POST /api/learning` | [`learningController.js`](backend/controllers/learningController.js) → `create` |
| **READ all** | List articles (optional category filter) | `GET /api/learning?category=...` | `learningController.js` → `list` |
| **READ one** | Open a single article | `GET /api/learning/:id` | `learningController.js` → `get` |
| **UPDATE** | Edit title / category / body / cover | `PUT /api/learning/:id` | `learningController.js` → `update` |
| **DELETE** | Remove an article | `DELETE /api/learning/:id` | `learningController.js` → `remove` |

Reads are **public** (anyone can see). Writes are **admin-only**.

### What's checked

- **title, category, body** are required
- **category** must be one of these 4 fixed values:
  - "Gem Types"
  - "Buying Guide"
  - "Grading & Quality"
  - "Care & Maintenance"
- **cover image** is optional, must be `image/*` MIME, ≤ 25 MB

### Where the files are

| File | What it does |
|---|---|
| [`backend/models/Article.js`](backend/models/Article.js) | Article shape + the 4-category enum |
| [`backend/controllers/learningController.js`](backend/controllers/learningController.js) | All 5 operations |
| [`backend/routes/learning.js`](backend/routes/learning.js) | URL → function mapping |
| [`mobile/src/screens/learning/LearningScreen.js`](mobile/src/screens/learning/LearningScreen.js) | Customer list with chip filters |
| [`mobile/src/screens/learning/ArticleDetailScreen.js`](mobile/src/screens/learning/ArticleDetailScreen.js) | Customer read view |
| [`mobile/src/screens/learning/AdminArticlesScreen.js`](mobile/src/screens/learning/AdminArticlesScreen.js) | Admin list |
| [`mobile/src/screens/learning/ArticleFormScreen.js`](mobile/src/screens/learning/ArticleFormScreen.js) | Admin create/edit form |

---

## M3 · Marketplace + Offers

**What it is:** the shop window. Listings are individual pieces for sale. Customers can buy directly (cart) or — if `openForOffers` is on — make an offer.

### Listings — what you can do

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **CREATE** | Put a gem up for sale | `POST /api/marketplace` | [`marketplaceController.js`](backend/controllers/marketplaceController.js) → `create` |
| **READ all** | Browse all active listings (with sort + search) | `GET /api/marketplace` | `marketplaceController.js` → `list` |
| **READ one** | Open a listing | `GET /api/marketplace/:id` | `marketplaceController.js` → `get` |
| **UPDATE** | Change price / description / openForOffers | `PUT /api/marketplace/:id` | `marketplaceController.js` → `update` |
| **DELETE** | Remove a listing (soft — status='removed') | `DELETE /api/marketplace/:id` | `marketplaceController.js` → `remove` |

### Offers — what you can do

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **CREATE** | Customer submits an offer amount | `POST /api/offers` | [`offerController.js`](backend/controllers/offerController.js) → `create` |
| **READ mine** | Customer sees their own offers | `GET /api/offers/mine` | `offerController.js` → `mine` |
| **READ all** | Admin sees every offer | `GET /api/offers` | `offerController.js` → `listAll` |
| **UPDATE (decide)** | Admin accepts or rejects | `PATCH /api/offers/:id` | `offerController.js` → `decide` |

> No DELETE — offers stay forever as a record. Pending offers auto-reject when a sibling offer is accepted + paid.

### What's checked

**Creating a listing:**
- gemId, price, description **required**
- price ≥ 0
- the gem must exist with stockQty > 0

**Creating an offer:**
- listing must be **active** AND `openForOffers === true`
- amount must be ≥ 0

**Cart qty (added to cart on the mobile side):**
- maximum is the gem's `stockQty` (the stepper won't let you go higher)
- the server checks again at checkout in case stock changed

**Sort modes** for browsing: newest, oldest, priceAsc, priceDesc, rating.

### Where the files are

| File | What it does |
|---|---|
| [`backend/models/Listing.js`](backend/models/Listing.js) | Listing shape (active/sold/removed) |
| [`backend/models/Offer.js`](backend/models/Offer.js) | Offer shape (pending/accepted/rejected/paid) |
| [`backend/controllers/marketplaceController.js`](backend/controllers/marketplaceController.js) | Listing CRUD + sort logic |
| [`backend/controllers/offerController.js`](backend/controllers/offerController.js) | Offer create/list/decide |
| [`mobile/src/context/CartContext.js`](mobile/src/context/CartContext.js) | Cart state + qty stepper logic |
| [`mobile/src/screens/marketplace/MarketplaceScreen.js`](mobile/src/screens/marketplace/MarketplaceScreen.js) | Public list + sort chips |
| [`mobile/src/screens/marketplace/GemDetailScreen.js`](mobile/src/screens/marketplace/GemDetailScreen.js) | Hero, Add to cart, Make offer, Reviews |
| [`mobile/src/screens/marketplace/MakeOfferScreen.js`](mobile/src/screens/marketplace/MakeOfferScreen.js) | Customer offer form |
| [`mobile/src/screens/cart/CartScreen.js`](mobile/src/screens/cart/CartScreen.js) | Cart with qty stepper |
| [`mobile/src/screens/marketplace/AdminListingsScreen.js`](mobile/src/screens/marketplace/AdminListingsScreen.js) | Admin grid |
| [`mobile/src/screens/marketplace/ListingFormScreen.js`](mobile/src/screens/marketplace/ListingFormScreen.js) | Admin create/edit |

---

## M4 · Orders + Reviews

**What it is:** every paid checkout becomes an Order. The customer tracks it through 4 statuses. Once delivered, they can leave a Review with rating + tags + photos.

### Orders — what you can do

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **READ mine** | Customer's order history | `GET /api/orders` | [`orderController.js`](backend/controllers/orderController.js) → `mine` |
| **READ one** | Open an order | `GET /api/orders/:id` | `orderController.js` → `get` |
| **READ all** | Admin: every order | `GET /api/orders/all` | `orderController.js` → `listAll` |
| **UPDATE** | Admin moves status forward | `PATCH /api/orders/:id` | `orderController.js` → `advance` |
| **DELETE (cancel)** | Customer cancels a Confirmed order | `DELETE /api/orders/:id` | `orderController.js` → `cancel` |
| **UPDATE (cancel + refund)** | Admin cancels + refunds via Stripe | `POST /api/orders/:id/cancel-refund` | `orderController.js` → `cancelWithRefund` |

> Orders are **created** by the checkout endpoint, not directly by this controller. See M6 below.

### Reviews — what you can do

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **CREATE** | Customer posts a review | `POST /api/reviews` | [`reviewController.js`](backend/controllers/reviewController.js) → `create` |
| **READ by gem** | Public reviews for a gem (sort + filter) | `GET /api/reviews/:gemId` | `reviewController.js` → `byGem` |
| **READ stats** | Avg, distribution, tag counts | `GET /api/reviews/:gemId/aggregate` | `reviewController.js` → `aggregateForGem` |
| **READ mine** | Customer sees own reviews | `GET /api/reviews/mine` | `reviewController.js` → `mine` |
| **READ all** | Admin moderation list | `GET /api/reviews/all` | `reviewController.js` → `listAll` |
| **READ stats global** | Admin dashboard numbers | `GET /api/reviews/seller/stats` | `reviewController.js` → `sellerStats` |
| **UPDATE** | Customer edits within 30 days | `PUT /api/reviews/:id` | `reviewController.js` → `update` |
| **DELETE** | Customer or admin deletes | `DELETE /api/reviews/:id` | `reviewController.js` → `remove` |
| **UPDATE (admin reply)** | Admin replies publicly | `POST /api/reviews/:id/reply` | `reviewController.js` → `reply` |
| **DELETE (admin reply)** | Admin removes their reply | `DELETE /api/reviews/:id/reply` | `reviewController.js` → `removeReply` |

### What's checked

**Order status** must be one of: `Confirmed`, `Processing`, `Out for Delivery`, `Delivered`, `Cancelled`. Customer can only cancel from `Confirmed`.

**Cancel + refund**:
- Cannot cancel an order that is already `Cancelled` or `Delivered`
- For card payments: actually calls Stripe to refund the money
- Restores stock, reopens the listing, reverts paid offers — all in one transaction

**Review create / update — every rule, in plain words:**

| Rule | Why |
|---|---|
| Rating must be a whole number from 1 to 5 | Stars are integer |
| Comment can be empty OR 10–500 characters | Stops one-letter spam, prevents very long rants |
| Comment cannot contain a URL | Anti-spam — keeps reviews trustworthy |
| Comment cannot be all-caps (≥ 8 letters all uppercase) | "Stop shouting" rule |
| Comment cannot contain profanity from a blocklist | Family-friendly |
| Maximum 3 photos per review | Keeps Cloudinary usage in check |
| Maximum 3 tags from the 8 predefined "what went well" tags | Forces consistent labelling |
| One review per (order, customer) | Stops vote-stacking — Mongo enforces with a compound unique index |
| Edit only within 30 days of creation | Industry norm — stops surprise rating-change attacks on sellers |
| Admin reply: 5–300 characters | Reasonable length for moderation |

### Where the files are

| File | What it does |
|---|---|
| [`backend/models/Order.js`](backend/models/Order.js) | Order shape: items[] + address + payment method + status |
| [`backend/models/Review.js`](backend/models/Review.js) | Review shape + the 8 tags + adminReply subdoc |
| [`backend/controllers/orderController.js`](backend/controllers/orderController.js) | Order reads + status updates + cancel logic |
| [`backend/controllers/reviewController.js`](backend/controllers/reviewController.js) | All review operations + the validation helpers |
| [`mobile/src/screens/orders/OrdersScreen.js`](mobile/src/screens/orders/OrdersScreen.js) | Customer history |
| [`mobile/src/screens/orders/OrderDetailScreen.js`](mobile/src/screens/orders/OrderDetailScreen.js) | One order, with StatusTracker + Leave-a-review buttons |
| [`mobile/src/screens/orders/AdminOrdersScreen.js`](mobile/src/screens/orders/AdminOrdersScreen.js) | Admin queue with Cancel + Update buttons |
| [`mobile/src/screens/orders/AdminOrderUpdateScreen.js`](mobile/src/screens/orders/AdminOrderUpdateScreen.js) | Status picker |
| [`mobile/src/screens/orders/ReviewScreen.js`](mobile/src/screens/orders/ReviewScreen.js) | Customer post-review form |
| [`mobile/src/screens/reviews/MyReviewsScreen.js`](mobile/src/screens/reviews/MyReviewsScreen.js) | Customer's own reviews |
| [`mobile/src/screens/reviews/EditReviewScreen.js`](mobile/src/screens/reviews/EditReviewScreen.js) | Edit own review |
| [`mobile/src/screens/reviews/AdminReviewsScreen.js`](mobile/src/screens/reviews/AdminReviewsScreen.js) | Admin moderation with sort + filter |
| [`mobile/src/components/StatusTracker.js`](mobile/src/components/StatusTracker.js) | The 4-step progress bar |

---

## M5 · Bidding (Auctions)

**What it is:** time-limited auctions. Admin schedules them; customers place increasing bids; the winner pays through the same checkout flow.

### What you can do with it

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **CREATE** | Admin creates an auction (now or scheduled) | `POST /api/bids` | [`bidController.js`](backend/controllers/bidController.js) → `create` |
| **READ all** | Browse auctions (sweeps state first) | `GET /api/bids` | `bidController.js` → `list` |
| **READ one** | Open a single auction | `GET /api/bids/:id` | `bidController.js` → `get` |
| **UPDATE** | Admin edits description / endTime / scheduling | `PUT /api/bids/:id` | `bidController.js` → `update` |
| **UPDATE (place bid)** | Customer places a bid | `POST /api/bids/:id/place` | `bidController.js` → `place` |
| **DELETE** | Admin cancels (only if not closed) | `DELETE /api/bids/:id` | `bidController.js` → `remove` |

### What's checked

**Creating an auction:**
- gemId, startPrice, endTime are **required**
- endTime must be **in the future**
- if you set `scheduledStartAt`, it must be **before endTime** AND in the future
- the gem must have stockQty > 0

**Placing a bid:**
- the auction must be **active** (not scheduled or closed)
- the deadline must not have passed
- your amount must be **strictly greater** than the current highest bid

**Editing or deleting:**
- a **closed** auction cannot be edited or deleted (it has a winner already)
- a **cancelled** auction cannot be edited

**The lifecycle (in plain English):**

```
SCHEDULED  →  ACTIVE  →  CLOSED
                                ↳  winner pays via /api/checkout
ACTIVE     →  CANCELLED   (admin pulled it before anyone won)
```

The status flips happen "lazily" — the server checks at the start of every read/place. There is no scheduled job (Render's free tier doesn't support cron).

### Where the files are

| File | What it does |
|---|---|
| [`backend/models/Bid.js`](backend/models/Bid.js) | Bid shape + history[] + currentHighest |
| [`backend/controllers/bidController.js`](backend/controllers/bidController.js) | All bid operations + sweep call |
| [`backend/utils/lazyOpenBids.js`](backend/utils/lazyOpenBids.js) | Flips scheduled → active |
| [`backend/utils/lazyCloseBids.js`](backend/utils/lazyCloseBids.js) | Flips active → closed (records winner) |
| [`mobile/src/screens/bidding/BiddingScreen.js`](mobile/src/screens/bidding/BiddingScreen.js) | Customer list with countdown |
| [`mobile/src/screens/bidding/BidDetailScreen.js`](mobile/src/screens/bidding/BidDetailScreen.js) | Detail + place bid + winner CTA |
| [`mobile/src/screens/bidding/BidFormScreen.js`](mobile/src/screens/bidding/BidFormScreen.js) | Admin create/edit (now/schedule toggle) |
| [`mobile/src/screens/bidding/AdminBidsScreen.js`](mobile/src/screens/bidding/AdminBidsScreen.js) | Admin grid |
| [`mobile/src/components/CountdownTimer.js`](mobile/src/components/CountdownTimer.js) | "2d 3h 15m" timer |

---

## M6 · Payment + Cloudinary + Deployment

**What it is:** the choke point that turns "I want to buy this" into a real Order. All three buying paths (cart, accepted offer, won bid) go through one endpoint: `POST /api/checkout`.

### What you can do with it

| Operation | Meaning | URL | Where the code is |
|---|---|---|---|
| **CREATE (checkout)** | Pay & create an Order | `POST /api/checkout` | [`checkoutController.js`](backend/controllers/checkoutController.js) → `checkout` |
| **READ all (admin)** | List every payment | `GET /api/payments` | [`paymentController.js`](backend/controllers/paymentController.js) → `list` |
| **READ one (admin)** | One payment record | `GET /api/payments/:id` | `paymentController.js` → `get` |

> There is no Update or Delete on Payment. Refunds are handled by `orderController.cancelWithRefund` (M4 above).

### What's checked

When you POST to `/api/checkout`:
- `paymentMethod` must be either `card` or `cod`
- `shippingAddress` must have **fullName, phone, line1, city, postalCode, country** (line2 + notes are optional)
- For **card**: `paymentMethodId` (from Stripe SDK on the phone) is required
- For **cart** source: every listing must be `active` AND `qty ≤ gem.stockQty`
- For **offer** source: the offer must belong to you AND status === `accepted`
- For **bid** source: the bid must be `closed` AND you must equal `winner`

The total amount is **always recalculated on the server**. The mobile app cannot tamper with prices.

### What happens after a successful payment (one-by-one)

This is all done by [`backend/utils/finalizeSale.js`](backend/utils/finalizeSale.js):

1. For each item in the cart:
   - **Decrement** `gem.stockQty` by qty
   - **Close** the listing (status='sold') — only if stock hits 0 (for direct purchases) OR always (for offer/bid sales since they're 1-of-a-kind)
   - **Reject** any other pending offers on the same listing
2. Create one **Order** document with all items + the shipping address + payment method
3. Save the `lastAddress` on the user (for next checkout)

### Where the files are

| File | What it does |
|---|---|
| [`backend/models/Payment.js`](backend/models/Payment.js) | Payment shape (status enum: pending/success/failed/refunded) |
| [`backend/controllers/checkoutController.js`](backend/controllers/checkoutController.js) | The one-and-only buy endpoint |
| [`backend/controllers/paymentController.js`](backend/controllers/paymentController.js) | Admin reads |
| [`backend/utils/finalizeSale.js`](backend/utils/finalizeSale.js) | The choke point that creates the Order |
| [`backend/middleware/upload.js`](backend/middleware/upload.js) | All 4 Cloudinary uploaders (used by M1/M2/M4) |
| [`backend/config/cloudinary.js`](backend/config/cloudinary.js) | Cloudinary config from env vars |
| [`mobile/src/screens/cart/CheckoutScreen.js`](mobile/src/screens/cart/CheckoutScreen.js) | Address + payment method picker |
| [`mobile/src/screens/payment/PaymentScreen.js`](mobile/src/screens/payment/PaymentScreen.js) | Stripe card collection + POST /api/checkout |

### Why Cloudinary belongs to M6

The same upload middleware is used by Inventory (M1), Learning (M2), and Reviews (M4). M6 owns the **pipeline** — the actual `multer-storage-cloudinary` setup in `upload.js`. The other modules just call the uploaders.

### Deployment notes (also M6)

- Hosted on **Render** (free tier) at `https://wmt-a.onrender.com`
- Auto-deploys on every `git push origin main`
- Free tier sleeps after 15 min idle — first request takes ~30 seconds to wake up
- Atlas IP allow-list set to `0.0.0.0/0` (Render's IPs are not stable)

---

## Things every member should know

| Question | Short answer |
|---|---|
| Where is the JWT stored on the phone? | `AsyncStorage` under key `gm_token`. Read by `mobile/src/api/client.js`. |
| How does the app know if I'm an admin? | `user.role === 'admin'` from `AuthContext`. RootNavigator picks tabs accordingly. |
| What happens to images on delete? | Database records are removed/marked. Cloudinary assets stay (academic scope — we don't garbage collect). |
| Why are some operations soft-delete? | So historical orders + reviews still display correctly even after the source is "removed". |
| Where do validations live? | Two places. Schema-level (in `models/`) for shape rules, controller-level for business rules. The mobile form usually mirrors the server checks for instant feedback. |
| What's special about `finalizeSale.js`? | It's the **single function** that all 3 sale paths flow through. If you only learn one backend file, learn that one. |
