# Viva Cheatsheet — Simple Answers

This is a study guide written in plain words. Each question has a short answer you can give in viva.

> **How to use this:**
> 1. Read the questions for **your module** — try answering out loud.
> 2. Then read the **"every member"** section — the marker can ask anyone these.
> 3. The last section ("Demo in 60 seconds") is what you should be able to physically show on your phone.

For where the code lives, see [`COMPONENTS.md`](COMPONENTS.md).
For setup help, see [`RUN_LOCALLY.md`](RUN_LOCALLY.md).

---

## Tech-stack questions (every member should know these)

These are the questions any group member can be asked. Memorise the **short answer** — don't read the whole paragraph.

### 1. What is Expo and why did you use it?

**Short answer:** Expo is a wrapper around React Native that lets you run your app on iOS, Android, and the web from a single codebase, without needing Xcode or Android Studio. We chose it because it gives us a 6-week project a lot of free features (image picker, video player, Stripe SDK) and lets us test on a real phone via the Expo Go app.

### 2. Why MongoDB and not MySQL?

**Short answer:** MongoDB is a document database, so we can store complex shapes (like an Order with an array of items inside, each with their own gem and price) without joining tables. Atlas gives us a free hosted instance with replica sets, so transactions work.

### 3. What is JWT?

**Short answer:** A JSON Web Token. When a user logs in, the server creates a small string (the token) signed with a secret. The mobile app stores it and sends it on every request as `Authorization: Bearer <token>`. The server can verify the token without keeping any session in the database. **Why we use it:** stateless authentication — easier to scale, easier to deploy.

### 4. What is bcrypt?

**Short answer:** A password hashing function that's deliberately slow (about 100 ms per hash). We never store the actual password — we store the hash. To check a login, bcrypt re-hashes the candidate and compares. **Why slow on purpose:** brute-force attacks become too expensive.

### 5. What is Cloudinary?

**Short answer:** A cloud service that stores and serves images. We send uploaded photos straight to Cloudinary; we only store the resulting URL on our database doc. **Why not store images on our server:** Render's filesystem is wiped on every redeploy, so images would disappear.

### 6. What is Stripe?

**Short answer:** The payment processor. We use **test mode** which uses fake card numbers like `4242 4242 4242 4242`. The Stripe SDK on the phone collects the card and gives us an opaque ID; we send that to Stripe's API to charge it. **We never store card details ourselves** — that's their job.

### 7. What is React Context?

**Short answer:** Built-in React feature for sharing state across components without passing props through every layer. We use it for two things: `AuthContext` (who's logged in) and `CartContext` (what's in the cart).

### 8. Why `legacy-peer-deps`?

**Short answer:** The `multer-storage-cloudinary` package declares an old peer-dependency range. Newer npm versions block this by default. The flag tells npm to use the older resolution rules. We saved this in `.npmrc` so nobody has to remember it.

### 9. What is "lazy state" in your bidding system?

**Short answer:** Render's free tier doesn't have scheduled jobs (cron). So instead of running a job every minute to check expired auctions, we check at the start of every read. The trade-off: an auction that ended at 5pm is technically still "active" in the database until someone opens the auctions list — then the sweep flips it.

### 10. What does `npm install --legacy-peer-deps` actually do?

**Short answer:** It installs every package listed in `package.json` into `node_modules/`. The `--legacy-peer-deps` flag tells npm to be lenient about peer-dependency mismatches. After this command finishes, the project is runnable.

### 11. Why does the backend live on Render?

**Short answer:** Render's free tier auto-deploys from GitHub on every push. Zero infrastructure setup. The downside is it sleeps after 15 min of no requests — first request after sleep takes ~30s to wake up.

### 12. What is a controller in Express?

**Short answer:** The function that handles an HTTP request. The route file says "when this URL is hit, run this function". The controller reads `req.body`, talks to the database, and sends back `res.json(...)`. Each module has one controller file.

---

## Group · Authentication

### Q1. Walk me through registration.

The user fills the form (name, email, password). The mobile app calls `POST /api/auth/register`. The server checks the email isn't already used, hashes the password with bcrypt, creates the user, signs a JWT, and sends back `{ token, user }`. The app stores the token in AsyncStorage and switches to the Customer tabs.

### Q2. How do you keep someone logged in across reloads?

The token is in AsyncStorage. On app start, `AuthContext` reads it and calls `/api/auth/me` to get the fresh user. If that succeeds, the user is logged in. If it fails (token expired), we clear AsyncStorage and show Login again.

### Q3. What's stored in the JWT?

Just the user's id and role. Nothing sensitive — anyone can decode the payload. The signature (made with our `JWT_SECRET`) is what makes it trustworthy.

### Q4. Why does login not say "wrong password" vs "wrong email"?

If we said "wrong password", we'd be telling an attacker that the email exists in our system. So we say "Invalid credentials" for both cases.

### Q5. What's the difference between customer and admin?

A user has a `role` field (default `customer`). The middleware `adminOnly.js` checks this and returns 403 if not admin. The mobile app picks which tabs to show based on `user.role`.

### Q6. Where is the admin's password set?

In `backend/scripts/seedAdmin.js`. It reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`, hashes the password, and creates the user. Run once with `npm run seed:admin`.

### Q7. What if someone tampers with the JWT to change role from customer to admin?

The signature breaks. `jwt.verify` throws, the middleware returns 401. To forge a valid token they'd need our `JWT_SECRET`.

### Q8. Why did you use 6 as the minimum password length?

Industry baseline. The schema validator + the controller both check this. We could go higher (8, 10) but for an academic project 6 is fine.

### Q9. What is `req.user` and where does it come from?

The auth middleware (`backend/middleware/auth.js`) reads the token, looks up the User from the database, and attaches it to `req.user`. Every protected controller can rely on it.

### Q10. How does the app know to show admin tabs vs customer tabs?

`RootNavigator.js` reads `user.role` from `AuthContext`. If admin → AdminTabs; else CustomerTabs. The Auth stack only shows when the token is missing.

---

## M1 · Inventory

### Q1. What is a Gem?

The catalog SKU. Every listing, bid, offer, and order references a Gem doc for its name, type, colour, carats, and photos.

### Q2. Why are photos on the Gem and not on the Listing?

Single source of truth. If we put photos on the listing, we'd have to copy them every time a gem got re-listed. Now the listing pulls from the gem.

### Q3. What's `isAvailable`?

A boolean that reflects whether stockQty > 0. We set it automatically in a mongoose pre-save hook. So `Gem.find({ isAvailable: true })` is a quick way to find buyable gems.

### Q4. What happens when stock goes to zero?

`isAvailable` flips to false. In the checkout flow, the listing also flips to `sold` — see `finalizeSale.js`.

### Q5. How many photos can a gem have?

Up to 6. Multer's `array('photos', 6)` enforces this. Each photo can be up to 25 MB and any image MIME (JPG, PNG, HEIC, WEBP, etc.).

### Q6. What if I delete a gem that's in someone's order?

The Order has `gemNameSnapshot` and `photoSnapshot` fields captured at order time. So the order history still displays correctly even after deletion.

### Q7. Why is inventory admin-only?

The catalog is the spine of the system. If customers could mutate it, every other module breaks. The route file wraps all 5 endpoints with `adminOnly` middleware.

### Q8. What's the difference between "kept" and "new" photos when editing?

When editing a gem, the form shows existing photos (the URLs already on the doc). You can remove some by tapping the ×. New photos picked from the device are uploaded fresh. The backend handles both cases: new uploads → REPLACE photos; otherwise honour `keepPhotos` JSON.

### Q9. What MIME types are accepted?

Anything matching `image/*`. The filter in `upload.js` is permissive because iOS often sends `image/heic` which a stricter filter would reject. Cloudinary further validates the actual bytes.

### Q10. What happens if I send `stockQty: -1`?

The mongoose validator (`min: 0`) rejects it. The error middleware turns that into a 400 response.

---

## M2 · Learning Hub

### Q1. What is an Article?

An admin-written educational post. Has title, category, body, and an optional cover image.

### Q2. What are the 4 categories and why hardcoded?

"Gem Types", "Buying Guide", "Grading & Quality", "Care & Maintenance". The mobile UI shows them as filter chips, so we need exact-match values. Free text would let admins type "Buying  Guide" with two spaces and break grouping.

### Q3. How does category filtering work?

The mobile screen sends `?category=Buying%20Guide`. The server filters by exact match. There's a helper endpoint `GET /api/learning/categories` that returns the enum so the mobile can render the chips from one source of truth.

### Q4. What's "View related gems"?

A button on the article detail screen. Tapping it navigates to Marketplace with `presetSearch` set to a search term derived from the article. Marketplace reads `route.params.presetSearch` and applies it.

### Q5. How is the cover image uploaded?

The form sends multipart data. Multer parses it, uploads the file straight to Cloudinary, and gives us back a URL. We save just the URL on the article doc.

### Q6. What if the cover image is too big?

Multer rejects anything over 25 MB with a `LIMIT_FILE_SIZE` error. Our `withUploadErrorHandling` wrapper turns this into a 413 response with a clean message.

### Q7. Why do you have two Article screens (Learning vs AdminArticles)?

Customer view and admin view need different layouts. Customer sees only the published articles with category filters. Admin sees a list with Edit / Delete buttons.

### Q8. Can a customer delete an article?

No — the route file wraps the DELETE endpoint with `adminOnly`. Customer would get a 403.

### Q9. What does `publishedAt` do?

Timestamp set on creation. We could add a "draft" mode later but for now publish-on-create is enough.

### Q10. What happens to the Cloudinary image if I delete an article?

The DB record is removed. The Cloudinary asset stays there — academic scope, we don't garbage collect.

---

## M3 · Marketplace + Offers

### Q1. What's a Listing vs a Gem?

A Gem is the catalog SKU. A Listing is "this gem is for sale at this price". The listing references the gem.

### Q2. How does Make-an-Offer work end to end?

Customer types an amount → `POST /api/offers` → admin sees it on AdminOffersScreen → `PATCH /api/offers/:id { action: 'accept' }` → offer status flips to `accepted` → customer sees it in My Offers and can pay → `POST /api/checkout { source: 'offer', sourceId: ... }`.

### Q3. What happens to other pending offers when one is accepted?

Nothing. They stay pending until the chosen customer actually pays. Only at payment time (in `finalizeSale.js`) do we reject the siblings. **Why:** if the customer never pays, the listing should still be available to other offers.

### Q4. How does the cart sort work?

`MarketplaceScreen` sends `?sort=newest|priceAsc|priceDesc|rating`. The backend has a `SORT_MAP` for the simple ones, and an extra aggregation over reviews for `rating`.

### Q5. Where does the cart live?

In `mobile/src/context/CartContext.js`. State is in React Context, persisted to AsyncStorage under key `gm_cart_v1`. So it survives app reloads.

### Q6. Why is qty capped at gem.stockQty?

Both client (CartContext.updateQty) and server (resolveItems in checkoutController) enforce. Two checks for the same rule = defense in depth, also handles the race when stock changes between adding to cart and checkout.

### Q7. What is `openForOffers`?

A boolean on the listing. When false, the "Make an offer" button is hidden and the offer endpoint returns 400 if you try.

### Q8. Why do you do search in JS instead of Mongo?

The search is across `gem.name` (which lives on the populated gem, not the listing). A native Mongo regex would need a complex aggregate. For a small catalog, filtering in JS is simpler and fast enough.

### Q9. What's the difference between status='sold' and status='removed' on a Listing?

`sold` = a customer paid for it. `removed` = the admin pulled it (DELETE /api/marketplace/:id). Both hide it from the public list, but the distinction matters for analytics.

### Q10. What if two customers buy the same listing at the same time?

Both call `/api/checkout`. The first one's `finalizeSale` decrements stock and (when stock hits 0) closes the listing. The second one sees the listing as `sold` (or stockQty < qty) and gets a 409. The Stripe charge for the second is refunded automatically.

---

## M4 · Orders + Reviews

### Q1. Walk me through a successful order.

`POST /api/checkout` → server resolves items + total → Stripe charge (or skip for COD) → `Payment.create` → `finalizeSale` (stock decrement + listing close + offer reject + Order create) → response. Mobile shows Confetti and replaces the screen with OrderDetail.

### Q2. How does an admin advance order status?

AdminOrderUpdateScreen → tap a status pill → `PATCH /api/orders/:id { status: 'Processing' }`. Server validates the new status is in the enum, saves, returns updated order.

### Q3. Can a customer cancel anytime?

No — only when status is `Confirmed`. After that, `DELETE /api/orders/:id` returns a 400. The reasoning: once we've started processing the order (e.g. boxed it up), we want the cancel-with-refund flow instead of a silent cancel.

### Q4. What does cancel-with-refund do?

It's admin-only. For each item in the order: restores `gem.stockQty`, reopens the listing if it was `sold`, reverts paid offers to `rejected`. Then for card payments it calls `stripe.refunds.create()`. COD orders skip the Stripe call but mark the Payment as `refunded` for audit.

### Q5. List the review validations.

- Rating: integer 1–5
- Comment: empty OR 10–500 chars
- No URLs in comment (anti-spam)
- No all-caps shouting (≥ 8 letters all uppercase)
- No profanity from the blocklist
- Max 3 photos
- Max 3 tags from 8 predefined
- One review per (order, customer) — Mongo compound unique index
- 30-day edit window from creation
- Admin reply: 5–300 chars

### Q6. Why a 30-day edit window?

If reviews could be edited forever, a malicious customer could post 5 stars, wait until the seller built up reputation, then change to 1 star. 30 days is a balance — long enough to fix typos, short enough to be safe.

### Q7. How are tags chosen?

The 8 tags are defined in `models/Review.js` as `REVIEW_TAGS`. The mobile uses `GET /api/reviews/tags/list` to read them. Customer picks up to 3.

### Q8. What does the admin see in the moderation screen?

Aggregate stats card (avg rating, 1-5★ distribution, top tag mentions), filter chips (All / With photos / Needs reply / Replied), sort tabs (Newest / Oldest / Highest / Lowest), then each review card with reply + delete buttons.

### Q9. What is `adminReply`?

An embedded subdocument on the Review: `{ text, by, repliedAt }`. Admin posts it via `POST /api/reviews/:id/reply`. Visible publicly to all customers on the gem detail screen.

### Q10. What if I try to review a Confirmed order?

Server returns 409 "You can only review delivered orders". The mobile UI also hides the "Leave a review" button until status is Delivered, but server-side enforcement is the real safety net.

---

## M5 · Bidding

### Q1. What's the bid lifecycle?

```
SCHEDULED  →  ACTIVE  →  CLOSED  (winner declared)
ACTIVE     →  CANCELLED  (admin pulled it)
```

### Q2. What does "lazy close" mean?

We don't run a cron. Instead, every time someone reads `/api/bids`, the server first runs `lazyOpenBids` (flips scheduled → active when start time arrived) and `lazyCloseBids` (flips active → closed when end time passed). The DB is briefly stale until someone reads.

### Q3. Why no cron?

Render's free tier doesn't include scheduled jobs. Adding one would mean upgrading to a paid plan. Lazy close is the pragmatic compromise.

### Q4. What does place-bid validate?

- Bid must be `active` (sweep runs first to flip stale states)
- `now < endTime`
- `amount > currentHighest.amount` (or > startPrice if no bids yet)

### Q5. What's "Schedule" mode in BidFormScreen?

Admin picks a future `scheduledStartAt`. The bid is created with status `scheduled`. It only flips to `active` when the start time arrives + someone reads (lazyOpenBids).

### Q6. How does the winner pay?

After the auction closes, BidDetailScreen shows a "Pay" button if `bid.winner === me`. Tap → Checkout with `source='bid', sourceId=bid._id`. Backend re-validates that this user is the winner.

### Q7. What's stored in `history`?

An array of `{ customer, amount, placedAt }` — every successful bid. Renders as the bid history list on the detail screen.

### Q8. Two customers place the same amount at the same time — what happens?

We require **strictly greater than** the current highest. So two equal amounts can't both pass — the second one would see the updated currentHighest and fail. There's a tiny race window between read and write that we don't fully cover (production would use optimistic locking).

### Q9. Can an admin extend endTime mid-auction?

The update endpoint allows changes to scheduled or active auctions, but not closed/cancelled ones. In practice, extending mid-auction would be unfair to existing bidders — academic scope, we accept this trade-off.

### Q10. What is the CountdownTimer component?

`mobile/src/components/CountdownTimer.js`. Uses `setInterval(1000)` to format `endTime - now` as "2d 3h 15m". Turns red when < 1h.

---

## M6 · Payment + Cloudinary + Deployment

### Q1. Walk me through a card payment.

1. CheckoutScreen → PaymentScreen
2. Stripe SDK collects the card, returns a `paymentMethodId`
3. Mobile sends `POST /api/checkout { source, paymentMethod: 'card', paymentMethodId, shippingAddress, ... }`
4. Server creates a Stripe PaymentIntent with `confirm: true`
5. On `succeeded` → Payment.create + finalizeSale + Order.create
6. Response → mobile shows Confetti + jumps to OrderDetail

### Q2. What about COD?

No Stripe call. Payment.create with status `pending`. finalizeSale runs the same way. The customer pays the courier in cash; admin marks Payment success later (manual flow — academic scope).

### Q3. Why is `totalAmount` server-derived?

Trust boundary. The mobile could lie about the price. Server reads listing/offer/bid amounts from the DB and computes the total itself. Stripe gets that number, not the client's.

### Q4. Why does Cloudinary upload "stream"?

`multer-storage-cloudinary` pipes the request body straight to Cloudinary's API. Express never holds the file in memory. Render's filesystem is ephemeral anyway.

### Q5. What if `finalizeSale` crashes after the Stripe charge?

We mark the Payment as `failed` and rethrow. The PaymentIntent stays charged on Stripe — the recovery is manual refund via the dashboard. Mongoose transactions could tighten this; that's the documented next step.

### Q6. Why "no card data ever touches our DB"?

The Stripe SDK creates a paymentMethod on Stripe's servers and only sends us the opaque ID. We send that to Stripe; Stripe sends back a PaymentIntent ID. We store the PaymentIntent ID, not the card. Compliance-wise we stay out of PCI-DSS scope.

### Q7. What's `.npmrc` for?

It pins `legacy-peer-deps=true` so `npm install` works without the manual flag. Required because `multer-storage-cloudinary` declares an outdated peer-dep range.

### Q8. Why does Render sleep?

Free tier behaviour to limit costs. After 15 min of no requests the container is suspended. First request after sleep takes ~30s to wake up. We document this in viva notes — and ping `/api/health` right before the demo.

### Q9. Why is Atlas IP allow-list `0.0.0.0/0`?

Render's outbound IPs aren't published as a stable list. For an academic project with strong DB credentials, opening to all is acceptable. Production would use Atlas Private Endpoints or VPC peering.

### Q10. How does deployment update?

`git push origin main` → Render's GitHub webhook fires → Render rebuilds (`npm install --legacy-peer-deps`) → starts (`node server.js`) → swaps traffic. ~3 min total. Auto, no manual step.

---

## "What if X fails?" — likely curveballs

| Scenario | Answer |
|---|---|
| Stripe times out mid-payment | We return 402; admin reconciles via Stripe Dashboard. The PaymentIntent might still complete on Stripe's side. |
| MongoDB drops connection | Mongoose buffers briefly, then errors. Server returns 500. Mobile axios shows "Couldn't reach the server". |
| Two customers buy the last gem at the same time | Both call /api/checkout. Second one's finalizeSale throws "out of stock" — Payment is marked failed, Stripe refunded, customer sees 409. |
| Cloudinary upload fails halfway | multer throws → controller never reaches `.create()` → 500. The doc never gets a stale URL. |
| User's JWT expires during a long form | Next API call returns 401 → axios interceptor logs them out → form data is lost. (Improvement: refresh tokens — out of scope.) |
| Bid sweep skips an expired bid because no one views it | Bid stays "active" in DB but the place-bid endpoint still rejects new bids because `now < endTime` fails. So no incorrect bidding can happen — only the report is delayed. |
| User uploads a 100 MB photo | Multer's `LIMIT_FILE_SIZE` rejects with 413. Mobile shows a toast. |
| Render redeploys mid-demo | Container takes ~30s. Auto-deploy triggers on `git push`, so we don't push during demo. |
| Customer cancels then tries to review | Controller checks `order.status === 'Delivered'`. Cancelled order → 409. Mobile UI hides the button anyway. |
| Admin tries to delete an order with a successful payment | Currently allowed but contraindicated — better operation is `cancel-refund`. Documented as a known sharp edge. |

---

## Demo in 60 seconds — what every member should be able to show

1. **Log in as customer**, open Marketplace, sort by Top rated, **add 2 items to cart**, change qty to 2, checkout with **Stripe test card `4242 4242 4242 4242`**, see Confetti.
2. **Log in as admin**, find that order, advance it: Confirmed → Processing → Out for Delivery → Delivered.
3. **Log back in as customer**, open the delivered order, **leave a 5★ review** with photos and tags.
4. **Log in as admin**, open the review, **post a public reply**.
5. **Admin creates a bid** scheduled for 30 seconds from now. Wait. Refresh. Status flips to active. Customer places a bid. Wait until end. Refresh — bid auto-closes. Customer sees "You won" → pays.
6. **Admin cancels** a Confirmed order with refund. Stock returns to inventory; listing reopens; payment goes to `refunded`.

If you can do these six flows on your phone against the live Render URL, you're viva-ready.

---

## One last tip

When the marker asks a question you're not sure about: **find the file in COMPONENTS.md** and **read the comment block at the top of that file**. Every important file in this codebase now has one. The comment will give you the answer in plain English.
