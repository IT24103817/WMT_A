# GemMarket — Viva Cheatsheet

10 sample questions per module + answer hints + tech-stack questions everyone gets asked.

For where the code lives, see [`COMPONENTS.md`](COMPONENTS.md). For how to run the system, see [`RUN_LOCALLY.md`](RUN_LOCALLY.md).

---

## How to use this document

For each module, the questions are ordered easiest → hardest. Aim to know:
1. **Your file paths** — point at the screen, the controller, the model.
2. **The validation rules** — they will ask "what if I send X?". You should be able to answer without opening the file.
3. **One known trade-off** — the marker rewards self-awareness. E.g. "we used lazy-close for bids because Render free tier doesn't run scheduled jobs."

---

## Tech stack questions (all members)

| Q | Answer hint |
|---|---|
| Why Expo over bare React Native? | Single codebase iOS+Android+web, no Xcode/Gradle needed for dev, OTA updates, bundled SDKs (Stripe, image picker, video). Trade-off: bound to Expo's SDK release cycle. |
| Why MongoDB over a relational DB? | Schema flexibility for rapidly evolving subdocuments (orderItem, shippingAddress, adminReply). Atlas free M0 supports replica set + transactions. The data is document-shaped (no heavy joins beyond `populate`). |
| What is JWT and why are we using it? | JSON Web Token — signed (HS256, server's `JWT_SECRET`) blob the client carries in `Authorization: Bearer`. Stateless: server doesn't store sessions. Trade-off: can't invalidate before expiry without a denylist (acceptable for academic scope). |
| Why bcrypt for passwords? | Slow by design (cost factor 10) so brute-force attacks are expensive. Each password gets a unique salt embedded in the hash. We never store plaintext. |
| What is Cloudinary and why not store images on the server? | CDN-backed media host. Render's filesystem is ephemeral (resets on every redeploy), so any local upload would vanish. Cloudinary gives us a permanent URL + automatic CDN + on-the-fly transformations. |
| What is Stripe test mode? | A separate Stripe environment with fake card numbers (`4242 4242 4242 4242`). No real money moves. Lets us demonstrate the full payment flow in viva without a real card. |
| Why do you use a `finalizeSale` utility? | It's the choke point shared by all 3 sale paths (cart, accepted offer, won bid). Doing the side effects (decrement stock, close listing, reject siblings, create order) in one place avoids 3-way duplication and inconsistent behaviour. |
| What is React Context and why use it for auth/cart? | Built-in dependency injection. Lets every screen read `user`/`cart` without prop-drilling. AsyncStorage layer survives reloads. Redux would be overkill at this scale. |
| What's the difference between SDK 54 Reanimated and Animated? | `Animated` runs on the JS thread; `Reanimated` runs animations on the UI thread via worklets — smooth even when the JS thread is busy. We use it for hero parallax, list staggers, and FadeInDown. |
| Why does the `.env` file exist and what's in it? | Secrets that must NOT enter git (`MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `CLOUDINARY_API_SECRET`). `.gitignore` excludes `.env`; we ship `.env.example` as a template. |
| Why `legacy-peer-deps`? | `multer-storage-cloudinary` declares an old peer-dep range for `multer`. npm 7+ refuses by default. The flag tells npm to use the npm 6 resolution. Documented in `.npmrc`. |
| What's "lazy state" in your bid system? | Instead of running a cron to flip statuses on schedule, we run the sweep at the start of every `GET /api/bids`. Trade-off: state is stale until someone reads it. Fine for academic demos; a cron would be the right answer at production scale. |

---

## Group · Authentication

1. **Walk me through registration.**
   Form → `POST /api/auth/register` → `bcrypt.hash(pw, 10)` → `User.create` → JWT signed with `JWT_SECRET` → mobile receives `{ user, token }` → AsyncStorage write → `RootNavigator` flips to the customer tab stack.

2. **What's stored in the JWT?**
   `{ id, role }`. Nothing sensitive. Verified by `auth.js` middleware, which then loads the full user via `User.findById(decoded.id)`.

3. **What if two people register with the same email?**
   Mongoose unique index on `email`. Second insert raises `E11000`. The error middleware maps it to `409 "Email already registered"`.

4. **Why do you not return whether the email exists on a failed login?**
   Information disclosure: helps attackers enumerate valid emails. We always return `401 "Invalid credentials"`.

5. **What happens when the token expires?**
   `auth.js` returns 401. The axios interceptor in `client.js` catches it and triggers `AuthContext.logout()`, which clears AsyncStorage and bounces the user to the Login screen.

6. **Where is the admin's password set?**
   `backend/scripts/seedAdmin.js`. It reads `ADMIN_EMAIL` + `ADMIN_PASSWORD` from `.env`, hashes, and upserts. Run once with `npm run seed:admin`.

7. **Why bcrypt with cost 10?**
   ~100ms per hash on modern hardware — fast enough for users, slow enough to make brute-force expensive. Higher cost = slower login; 10 is the OWASP-recommended floor.

8. **How does the admin tab vs customer tab decision happen?**
   `RootNavigator.js` reads `user.role` from `AuthContext`. If `'admin'` → `AdminTabs`; else `CustomerTabs`. The Auth stack only mounts when `token` is null.

9. **What if someone tampers with the JWT to change role from customer to admin?**
   The signature won't verify — `jwt.verify` throws, middleware returns 401. They'd need `JWT_SECRET` to forge a valid token.

10. **What's `req.user` and where does it come from?**
    Set by `auth.js` middleware after JWT verification. It's the full `User` document (without the password hash). Every protected controller relies on it.

---

## M1 · Inventory

1. **What's a Gem in your model?**
   The catalog SKU. Has name/type/colour/carats/stockQty + photos[]. Listings, bids, offers, and orders all reference it.

2. **How does `isAvailable` get updated?**
   In `finalizeSale` after stock decrement: `gem.isAvailable = gem.stockQty > 0`. So once stock hits 0, the gem is hidden from new listings.

3. **What happens when you delete a gem?**
   Hard delete via `findByIdAndDelete`. Existing orders still display the snapshot (`gemNameSnapshot`, `photoSnapshot`) so historical orders don't break.

4. **Why are photos on the Gem and not on the Listing?**
   Single source of truth. If we ran multiple listings off the same gem, we'd have to duplicate photos. Now the listing pulls them via `listingPhoto()`.

5. **What's the max number of photos and why?**
   6, configured in `gemPhotosUpload` in `upload.js`. Cloudinary free tier has a 25-credit/month limit; 6 photos × N gems is comfortable.

6. **What MIME types do you accept?**
   The multer `fileFilter` allows `image/*`. Cloudinary's `allowed_formats` whitelist further restricts to JPG/PNG/HEIC/HEIF/WEBP/AVIF/GIF. iOS commonly delivers HEIC.

7. **How does the inventory list refresh after a delete?**
   `useFocusEffect` re-runs `load()` whenever the screen regains focus. So after `goBack()` from the form, the list reloads.

8. **Why is this admin-only?**
   Inventory is the spine of the marketplace. Allowing customers to mutate it would corrupt every other module. The `adminOnly` middleware returns 403 for non-admins.

9. **What if an admin sets `stockQty` to a negative number?**
   Mongoose `min: 0` validator rejects. The error middleware maps validation errors to 400 with the field name.

10. **What's "kept vs new" in the photo picker?**
    When editing, the screen knows which existing Cloudinary URLs to retain (`keepPhotos[]`) vs new device files to upload. The backend update controller honours both.

---

## M2 · Learning Hub

1. **What is an Article?**
   An admin-written educational post. Has `title`, `category` (4-enum), `body`, `coverImageUrl`. Public read, admin write.

2. **How do customers find articles by category?**
   `GET /api/learning?category=Buying%20Guide`. The mobile screen renders chip filters that pre-set this.

3. **What's the "View related gems" button?**
   On the article detail, it calls `navigation.navigate('Market', { presetSearch: article.category })`. The marketplace screen reads `route.params.presetSearch` and applies it to the search box.

4. **How is the cover image uploaded?**
   `multer.single('cover')` → multer-storage-cloudinary → image streamed to Cloudinary → response includes the `secure_url` → controller stores that URL on the article doc.

5. **What's the difference between `category` and `type`?**
   Article `category` is curriculum-style ("Buying Guide", "Care & Maintenance"). Gem `type` is the rock ("Sapphire", "Ruby"). We sometimes route from one to the other for content discovery.

6. **What happens if I `POST /api/learning` without auth?**
   The route stack is `[auth, adminOnly, articleCoverUpload.single('cover'), controller.create]`. Auth middleware bounces it with 401 before it reaches the controller.

7. **Why is `publishedAt` a separate field from `createdAt`?**
   Optionality. `createdAt` is mongoose-managed. `publishedAt` lets us draft an article (created but not published) — although the current scope publishes immediately.

8. **Can a customer delete an article?**
   No — the route is gated by `adminOnly`. They'd get a 403.

9. **Why an enum for category instead of a free-text field?**
   Filter consistency. Free text would let admins type "Buying  Guide" with two spaces and break grouping. Enum + dropdown forces canonical values.

10. **What's the upload size limit?**
    multer default is unlimited; we rely on Cloudinary's free-tier per-file 10 MB max. Anything bigger gets a 400 from Cloudinary, which we propagate.

---

## M3 · Marketplace + Offers

1. **What's the difference between a Listing and a Gem?**
   Gem = SKU (the catalog entry). Listing = a single piece for sale at a specific price. A listing references a gem and inherits its photos/specs.

2. **Walk me through "Make an offer".**
   Customer types amount → `POST /api/offers { listingId, amount }` → admin sees it on AdminOffersScreen → `PATCH /api/offers/:id { action: 'accept' }` → offer flips to `accepted` → customer sees it in MyOffers and can pay → `/api/checkout` with `source: 'offer'`.

3. **What happens to other offers when one is accepted?**
   Nothing — until payment. `finalizeSale` rejects sibling pending offers only after the buying customer actually pays. This avoids a deadlock if they never come back.

4. **How does the cart sort work?**
   `MarketplaceScreen` passes `sort=newest|priceAsc|priceDesc|rating` as a query param. Backend has a `SORT_MAP` for the simple ones and an aggregate over Reviews for `rating`.

5. **Where does cart state live?**
   `mobile/src/context/CartContext.js`. It's a React Context, persisted to `AsyncStorage` under key `gm_cart_v1`. Hydration happens on app launch.

6. **Why qty cap at `gem.stockQty`?**
   Both client (`updateQty`) and server (`resolveItems`) enforce. Client gives instant feedback; server is the source of truth — race condition between two buyers is caught at checkout.

7. **What's `openForOffers`?**
   Boolean flag on the listing. When false, the "Make an offer" button is hidden and `POST /api/offers` returns 400 if attempted.

8. **What if a listing's gem has stockQty > 1 and I add 3 to my cart?**
   You can. The qty stepper lets you go up to 3 (the cap). At checkout, server decrements stock by 3. The listing only flips to `sold` when `gem.stockQty === 0`.

9. **Why is the listing search done in JS instead of Mongo?**
   The search is across `gem.name` and `listing.description`, but `name` lives on the populated gem. A native Mongo regex would need an `$lookup` aggregation. For a small catalog the JS filter is simpler and fast enough.

10. **What's the difference between `status: 'sold'` and `status: 'removed'`?**
    `sold` means a customer paid for it. `removed` means the admin pulled it (DELETE /api/marketplace/:id). Both hide it from public listings; the distinction matters for analytics.

---

## M4 · Orders + Reviews

1. **Walk me through a successful order.**
   `POST /api/checkout` → server resolves items + total → Stripe (or skip for COD) → Payment.create → `finalizeSale` → Order.create with status='Confirmed'. Mobile: PaymentScreen → Confetti → `replace('OrderDetail')`.

2. **How does an admin advance a status?**
   AdminOrderUpdateScreen → tap a status pill → `PATCH /api/orders/:id { status }`. Controller validates the new status is in the enum, saves, returns updated order. Customer sees the change next time they open the order (via `useFocusEffect`).

3. **What if a customer cancels at `Out for Delivery`?**
   Customer endpoint (`DELETE /api/orders/:id`) only accepts cancellation while status is `Confirmed` — past that, returns 409. Admin can still cancel-with-refund at any non-final status via `POST /api/orders/:id/cancel-refund`.

4. **What's "cancel with refund"?**
   Admin-only. Walks every item: restores `gem.stockQty`, reopens the listing if it was closed, reverts paid offers to pending, then calls Stripe `refunds.create` for card payments. COD orders skip the Stripe call but still mark the Payment as `refunded`.

5. **What validations does a Review have?**
   Rating: integer 1–5. Comment: 0 chars OR 10–500. **No URLs** (regex). **No all-caps** (≥8 letters all uppercase blocked). Profanity blocklist. Max 3 photos. Max 3 tags from 8 predefined. One review per `(order, customer)` (compound unique index). Edit window: 30 days.

6. **Why a 30-day edit window?**
   Balance: customer should be able to fix typos / change their mind, but reviews shouldn't be infinitely mutable (would let people post a 5★ then change to 1★ months later, after the seller relied on the rating). 30 days is the industry norm.

7. **How are tags chosen?**
   `REVIEW_TAGS` const in `Review.js` — 8 predefined values like `Authentic Gem`, `Fast Shipping`. Customers pick up to 3. The model has a validator that rejects anything not in the list.

8. **What does the admin see on AdminReviewsScreen?**
   Aggregate stats card (avg rating, distribution bar, top mentions tag chips), then the list with sort tabs (Newest/Oldest/Highest/Lowest) + filter chips (All / With photos / Needs reply / Replied), each review with reply + delete buttons.

9. **What's the `adminReply` subdocument?**
   `{ text, by, repliedAt }`. Admin posts via `POST /api/reviews/:id/reply` (5–300 chars). Removed via `DELETE /api/reviews/:id/reply`. Visible to all customers on the gem detail.

10. **What if I try to review a Confirmed order?**
    Controller returns `409 "You can only review delivered orders"`. The mobile UI also hides the "Leave a review" button until `order.status === 'Delivered'`.

---

## M5 · Bidding

1. **What's the bid lifecycle?**
   `scheduled` → (when `scheduledStartAt <= now`) → `active` → (when `endTime < now`) → `closed` (`winner` = `currentHighest.customer`). Or `cancelled` if admin pulls it.

2. **What's "lazy close"?**
   Instead of a cron job, we run `lazyOpenBids` + `lazyCloseBids` at the start of every `GET /api/bids[/<id>]`. Sweeps any bid whose state is stale and updates it. Trade-off: a closed bid stays "active" until someone reads.

3. **Why no cron?**
   Render's free tier doesn't include scheduled jobs. Adding one would mean upgrading to a paid plan or running an external service. Lazy close is the pragmatic answer for an academic system.

4. **How does the place-bid validation work?**
   Server checks: `bid.status === 'active'` (and not just stored — sweep runs first), `Date.now() < bid.endTime`, `amount > (currentHighest.amount || startPrice)`. Any failure → 409. On success, append to `history[]` and update `currentHighest`.

5. **What's "Schedule" mode in BidFormScreen?**
   Admin picks a future `scheduledStartAt`. The bid is created with `status: 'scheduled'`. It only flips to `active` when the start time arrives + someone reads.

6. **How does the winner pay?**
   BidDetailScreen detects `bid.status === 'closed' && bid.winner === user.id` and shows a "Pay" button → `Checkout` with `source: 'bid'`. Backend `resolveItems` re-validates that this user is the winner.

7. **What's stored in `history`?**
   `[{ customer, amount, at }, ...]` — every successful bid placement. Renders on BidDetailScreen as "Bid history" cards.

8. **What if two customers place the same amount at the same time?**
   We require strictly **greater than** the current highest. Two equal amounts wouldn't both pass — the second one would see the updated `currentHighest` and 409. (There's a tiny race window between read and write; production would need optimistic locking.)

9. **Can an admin extend the end time mid-auction?**
   The `update` endpoint doesn't let you mutate `endTime` once `status === 'active'` — that would be unfair to existing bidders. You'd have to cancel and recreate.

10. **What's the `CountdownTimer` component?**
    `mobile/src/components/CountdownTimer.js` — uses `setInterval(1000)` to format `endTime - now` as "2d 3h 15m". Renders in red when < 1h.

---

## M6 · Payment + Cloudinary + Deployment

1. **Walk me through a card payment.**
   CheckoutScreen → PaymentScreen → Stripe SDK `<CardField>` collects card → `useStripe().createPaymentMethod()` returns `paymentMethodId` → `POST /api/checkout { paymentMethod: 'card', paymentMethodId, ... }` → server: `stripe.paymentIntents.create({ confirm: true, payment_method })` → on `'succeeded'` we proceed; on anything else we return 402. Then Payment.create + `finalizeSale` + Order.create.

2. **What about COD?**
   No Stripe call. Payment is created with `status: 'pending'`. `finalizeSale` runs same way. The customer pays the courier in cash; admin will mark the Payment as `success` later (manual flow — academic scope).

3. **Why is `totalAmount` server-derived?**
   Trust boundary. The client could tamper with the price. Server reads listing/offer/bid prices from the DB, computes the total, and uses **that** for the Stripe charge. Client never sets the amount.

4. **Why is the Cloudinary upload streamed?**
   `multer-storage-cloudinary` pipes the request body directly to Cloudinary's API. Express never buffers the file on local disk. Render's filesystem is ephemeral anyway.

5. **What if `finalizeSale` fails after Stripe charged the card?**
   We mark the Payment as `failed` and rethrow. The PaymentIntent stays charged on Stripe. The customer's recourse is contacting support to refund. **Mongoose transactions would tighten this** — that's the documented next step.

6. **Why "no card data ever touches our DB"?**
   The mobile SDK creates a `paymentMethod` on Stripe's servers and only sends us the opaque ID. We send it to Stripe; we get back a PaymentIntent ID. We store the PaymentIntent ID, not the card. Compliance-wise, we're out of scope of PCI-DSS.

7. **What's `.npmrc`'s purpose?**
   Pins `legacy-peer-deps=true` so `npm install` works without the manual flag. Required because `multer-storage-cloudinary` declares an outdated peer-dep range.

8. **Why does Render sleep?**
   Free tier behaviour to limit costs. After 15 min of no requests, the container is suspended. First request after sleep takes ~30s to spin up. We document this in the demo notes — and ping `/api/health` right before the demo to warm up.

9. **Atlas IP allow-list — why `0.0.0.0/0`?**
   Render's outbound IPs aren't published as a whitelist. For an academic project, opening to all (combined with strong DB credentials) is acceptable. Production would use Atlas Private Endpoints or VPC peering.

10. **How does deployment update?**
    `git push origin main` → Render's GitHub webhook fires → Render rebuilds (`npm install --legacy-peer-deps`) → starts (`node server.js`) → swaps traffic. Total time: ~3 min. No manual step.

---

## "What if X fails" — likely curveballs

| Scenario | Answer |
|---|---|
| Stripe times out mid-payment | The PaymentIntent might still be in `processing`. We return 402 to the client; admin can reconcile via Stripe Dashboard. |
| MongoDB connection drops | Mongoose buffers operations briefly, then errors. Express error middleware returns 500. The mobile axios interceptor surfaces a generic "Couldn't reach the server" toast. |
| Two customers buy the last gem at the same time | Both call `/api/checkout`. The second one's `finalizeSale` throws "out of stock" because the first decremented. The second customer sees a 409 — payment is marked failed, Stripe is refunded. |
| Cloudinary upload fails halfway | multer-storage-cloudinary throws → controller never reaches `.create()` → 500 returned. The doc never gets a stale URL. |
| Customer's JWT expires during a long form | Their next API call returns 401 → axios interceptor logs them out → form data is lost. (Improvement: refresh tokens — out of scope.) |
| The bid sweep skips an expired bid because no one views it | The bid stays `active` in the DB. The `endTime` check on `place` still rejects new bids. So no incorrect bidding can happen — only reporting is delayed. |
| User uploads a 100 MB photo | Cloudinary's free tier rejects above ~10 MB with a clear error. Multer surfaces it as a 400. Client shows a toast. |
| Render redeploys mid-demo | New container takes ~30s. Auto-redeploy is triggered by `git push`, so we don't push during the demo. |
| Customer cancels then tries to review | Controller checks `order.status === 'Delivered'`. Cancelled order → 409. Mobile UI hides the button anyway. |
| Admin tries to delete an order with a successful payment | Currently allowed but contraindicated — the better operation is `cancel-refund`. Documented as a known sharp edge. |

---

## Five things every member should be able to demo in 60 seconds

1. **Log in as customer**, browse marketplace, **add 2 items to cart**, change qty, checkout with **Stripe test card**, see Confetti.
2. **Log in as admin**, advance the new order through Confirmed → Processing → Out for Delivery → Delivered.
3. **Customer leaves a review** with rating + tags + photo. Edit it. Admin replies.
4. **Admin creates a bid** scheduled for 30s in the future. Wait. Refresh. Status flips to active. Customer places bid. Wait until end. Refresh. Customer sees "You won". Pay.
5. **Admin cancels** a Confirmed order with refund. Stock returns to inventory; listing reopens; payment goes to refunded.

If you can do those five flows on your phone against the live Render URL, you're ready for viva.
