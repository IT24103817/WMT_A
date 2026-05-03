# Suggestions for Future Work

Concrete improvements organised by impact. Pick the high-impact ones for viva polish; defer the rest.

## A · Quick wins (1–2 hours each, high demo impact)

| Idea | Effort | Why it helps |
|---|---|---|
| **Wishlist / saved gems** for customers | 2h | Common e-commerce expectation; new tab + heart icon on cards |
| **Recently viewed** carousel on Home | 1h | Stored in AsyncStorage, nostalgic UX |
| **Currency selector** in Account | 1h | LKR / USD toggle reading from `CURRENCIES` constant; cosmetic only |
| **Order receipt PDF** download (admin) | 2h | Use `expo-print`; impressive at viva |
| **In-app notification center** | 2h | Replaces polling — admin pushes "your offer was accepted" via long-poll endpoint |
| **Empty state illustrations** | 1h | Replace emoji icons with `lottie-react-native` JSON animations (free from lottiefiles.com) |
| **Pull-to-refresh haptic** | 30m | Trigger `Haptics.success` on refresh complete |
| **Dark mode toggle** | 2h | Already token-driven — flip the colors object based on `useColorScheme()` |
| **Search history** in Marketplace | 1h | AsyncStorage-backed last-5 searches as chips below search bar |
| **Share gem listing** button | 1h | Native share sheet via `expo-sharing` |

## B · Spec-aligned polish (would close real spec gaps)

| Idea | Effort | Why it helps |
|---|---|---|
| Onboarding (3-slide intro) | 3h | First-launch carousel; shown until customer dismisses |
| Forgot password flow | 4h | Email + reset link via SMTP / Mailtrap; the spec doesn't require it but graders ask "what about password reset?" |
| Email notifications | 4h | Order confirmed, offer accepted, bid won — via [nodemailer](https://nodemailer.com) + Mailtrap |
| Image cropping before upload | 2h | `expo-image-manipulator` — square crop for gem photos |
| Marketplace pagination | 2h | Currently loads all listings at once — switch to `?page=&limit=` cursor |
| Search debouncing | 30m | Trigger search 300ms after typing stops, not on every keystroke |
| Offline indicator | 1h | NetInfo subscribe + banner |

## C · Robustness / production-readiness

| Idea | Effort | Why it matters |
|---|---|---|
| **Mongoose transactions in `finalizeSale`** | 3h | Currently sequential — wrap in `session.withTransaction()` so partial failures roll back |
| **Optimistic concurrency on bids** | 2h | Use `findOneAndUpdate` with `$gt: currentHighest` — the race documented in M5 viva notes |
| **Render Cron Job for bid expiry** | 1h | More reliable than lazy-close; runs every 60s |
| **Rate limiting** | 1h | `express-rate-limit` on `/api/auth/*` and `/api/offers` |
| **Helmet + compression** | 30m | Standard Express hardening |
| **Request ID + structured logging** | 1h | Pino + correlation IDs; makes debugging viva-day issues 10× easier |
| **Mongo indexes review** | 30m | Add indexes on `listings.gem`, `orders.customer`, `payments.customer` for fast queries |
| **Cloudinary signed uploads** | 2h | Currently using direct multer→Cloudinary; signed URLs prevent direct uploads bypassing the API |

## D · Testing depth

| Idea | Effort | Coverage gain |
|---|---|---|
| **Jest unit tests** on controllers | 4h | Mock Mongoose, hit each branch of `finalizeSale`, `paymentController.charge`, `offerController.decide` |
| **Supertest integration tests** | 4h | Real Express + in-memory Mongo (`mongodb-memory-server`); test the full HTTP flow |
| **Visual regression** with Playwright `expect(page).toHaveScreenshot()` | 3h | Locks in the current UI; flags any unintended style change |
| **Detox or Maestro** for native | 8h | Real device testing for Stripe + image picker — out of scope but the gold standard |
| **k6 load test** | 2h | "Can the API handle 50 concurrent customers placing bids?" — answer with metrics |

## E · Admin / business intelligence

| Idea | Effort | Impressiveness |
|---|---|---|
| **Admin dashboard summary** with KPI grid | 3h | Today's revenue, pending offers, active bids, low stock alerts |
| **Revenue chart** | 2h | `react-native-chart-kit` line graph of payments over last 30 days |
| **Bulk inventory CSV upload** | 2h | Admin uploads `.csv` → `papaparse` → batched `Gem.create` |
| **Order export to CSV** | 1h | Admin → "Export this month" → downloads CSV |
| **Stock low alerts** | 1h | Badge on inventory tab when any gem has stockQty ≤ 1 |

## F · Features outside the brief

| Idea | Effort | Note |
|---|---|---|
| **Gem comparison** (compare 2-3 listings side by side) | 4h | Cool but not in spec |
| **AR preview** (`expo-camera` overlay) | 8h | Demo gold but very heavy |
| **Multi-currency pricing** | 3h | LKR/USD/EUR display; backend stores USD canonical |
| **Multi-seller marketplace** | 12h | Major refactor — schema needs `seller` ref, not in scope |
| **AI gem identifier** (upload photo → suggest type) | 8h | Use Hugging Face image classification API |

---

## Recommended next step

If you have **2 hours** before viva:
1. Run the **15-step manual verification** on the deployed Render URL
2. Pick **one** quick win from §A — wishlist or recently viewed are visible to graders the moment they open the app
3. Run `cd e2e && npm test -- 12-api-contract` to catch any backend regression

If you have **a day**:
- Above + Mongoose transactions in `finalizeSale` + Render Cron job + admin dashboard summary

If you have **a weekend**:
- Above + Jest+Supertest test suite + Lottie empty states + visual regression baselines
