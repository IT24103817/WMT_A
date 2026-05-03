# GemMarket — End-to-End Tests (Playwright)

Drives the **Expo web build** + the live backend through Chromium.

## Why web (not Detox / Maestro)?

- Expo SDK 54 builds for web automatically (`react-native-web` already installed in `mobile/`)
- Playwright is industry standard, no Android/iOS toolchain required
- Stripe SDK is no-op on web (the [stripe shim](../mobile/src/stripe/index.web.js)) so payment specs verify the API path only
- Image upload via the `<input type="file">` web fallback works in Chromium

## Coverage (12 specs)

| # | File | What it covers |
|---|---|---|
| 01 | auth.spec.js | admin login, customer registration, bad-credentials toast |
| 02 | inventory.spec.js | full CRUD on a gem (admin) |
| 03 | marketplace-browse.spec.js | listing seeding via API + customer browse |
| 04 | offers-flow.spec.js | customer offer → admin accept → My Offers shows Pay button |
| 05 | bidding.spec.js | place bid, second-bid validation, "by you" indicator |
| 06 | orders-status.spec.js | admin orders tab + KPIs (skipped if no orders) |
| 07 | reviews.spec.js | admin Reviews moderation tab + seller stats endpoint shape |
| 08 | payments-admin.spec.js | admin Payments tab KPIs |
| 09 | learning-hub.spec.js | category chips render + admin can open new-article form |
| 10 | home-screen.spec.js | hero, Featured, sections render |
| 11 | seller-profile.spec.js | Visit the Atelier from Account |
| 12 | api-contract.spec.js | 7 contract checks against the backend (register, role gating, public endpoints, enums) |

## Running locally

```bash
# 1. Backend running on :5000 (with seeded admin)
cd backend && npm run seed:admin && npm run dev

# 2. Mobile web build running on :8081
cd mobile && npx expo start --web

# 3. Playwright (in a third terminal)
cd e2e
npm install
npm run install-browsers   # downloads chromium ~~ 130 MB
npm test                   # headless
npm run test:headed        # see the browser
npm run test:ui            # Playwright UI mode for debugging
```

## Env vars

| Var | Default |
|---|---|
| `PLAYWRIGHT_BASE_URL` | `http://localhost:8081` (Expo web) |
| `E2E_API_URL` | `http://localhost:5000` |
| `ADMIN_EMAIL` | `admin@gemmarket.local` |
| `ADMIN_PASSWORD` | `ChangeMe!2026` (override to your seed password) |

Set `ADMIN_PASSWORD` to whatever you have in `backend/.env` before running.

## CI snippet

```yaml
# .github/workflows/e2e.yml
- run: cd backend && npm install --legacy-peer-deps
- run: cd mobile  && npm install
- run: cd e2e     && npm install && npx playwright install chromium
- run: cd backend && npm run seed:admin
- run: cd backend && npm start &
- run: cd mobile  && npx expo start --web --no-dev &
- run: sleep 30                # let both warm up
- run: cd e2e     && npm test
- if: failure()
  uses: actions/upload-artifact@v4
  with: { name: playwright-report, path: e2e/playwright-report }
```

## Known limitations

- **Stripe specs are intentionally minimal.** The web shim returns "Stripe not supported on web" — full payment is verified manually on the device build (see [docs/E2E_VERIFICATION.md](../docs/E2E_VERIFICATION.md)).
- **Image uploads** in spec 03/04 use a 4-byte placeholder JPEG. Real uploads to Cloudinary work but are tested manually.
- **Orders status spec (06)** is skipped if no payments have been completed — order creation depends on Stripe which is mobile-only.

For everything Playwright can't reach, the manual verification doc (15 steps) is the source of truth.
