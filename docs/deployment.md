# Deploying GemMarket to Render

This deploys the backend to Render's free web service tier, talking to MongoDB Atlas + Cloudinary + Stripe (test mode). Estimated time: 15–20 minutes.

## Prerequisites

- The repo pushed to GitHub (Render deploys from a git remote)
- MongoDB Atlas cluster with a connection string (see `docs/setup.md` step 3)
- Cloudinary account (steps 4 in setup.md)
- Stripe test keys (step 5 in setup.md)

## 1 · Push the repo to GitHub

```bash
cd /Users/ibrahimarshad/Desktop/WMT
git add .
git commit -m "Initial GemMarket scaffold"
# Create a new empty repo on github.com first, then:
git remote add origin git@github.com:<you>/gemmarket.git
git branch -M main
git push -u origin main
```

## 2 · Whitelist Render in Atlas

Render's outbound IPs are dynamic on the free plan, so allow all:

1. Atlas → **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
2. (Production note: lock this down later by switching to MongoDB Atlas's IP allowlist for Render's published IP ranges.)

## 3 · Create the Render Web Service

1. https://dashboard.render.com → **New** → **Web Service** → connect your GitHub repo
2. Fill in:
   - **Name:** `gemmarket-api` (this becomes part of the URL)
   - **Region:** the one closest to your demo audience
   - **Branch:** `main`
   - **Root Directory:** `backend`     ← important; the repo is a monorepo
   - **Runtime:** Node
   - **Build Command:** `npm install --legacy-peer-deps`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
3. Click **Advanced** → **Environment Variables** and add **all** of these (matching `backend/.env.example`):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` (Render sets `PORT` itself, but harmless) |
   | `MONGO_URI` | your Atlas SRV string |
   | `JWT_SECRET` | long random string (`openssl rand -hex 32`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `ADMIN_NAME` | `GemMarket Admin` |
   | `ADMIN_EMAIL` | `admin@gemmarket.local` |
   | `ADMIN_PASSWORD` | strong password — you'll log in with this |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
   | `STRIPE_SECRET_KEY` | `sk_test_…` |
   | `STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
   | `CORS_ORIGINS` | `*` for dev demo, or comma-separated origins |

4. **Create Web Service** — first deploy takes ~3 minutes.

## 4 · Seed the admin user (one-off)

Render's free tier doesn't expose an SSH shell, so run the seed locally pointing at production Atlas:

```bash
cd backend
# Temporarily swap MONGO_URI in .env to the production cluster
npm run seed:admin
# Now revert .env back to your local cluster string
```

Output: `Admin user ready: admin@gemmarket.local`. You can now log in to the deployed app with that email + your `ADMIN_PASSWORD`.

## 5 · Verify the deploy

```bash
curl https://gemmarket-api.onrender.com/api/health
# → {"status":"ok","service":"gemmarket-api","time":"…"}
```

Test the full auth round-trip:
```bash
curl -X POST https://gemmarket-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gemmarket.local","password":"<ADMIN_PASSWORD>"}'
# → {"token":"…","user":{"id":"…","role":"admin",…}}
```

## 6 · Point the mobile app at the deployed backend

```bash
cd mobile
# Edit .env
EXPO_PUBLIC_API_URL=https://gemmarket-api.onrender.com
EXPO_PUBLIC_STRIPE_PK=pk_test_…
```

Restart `npx expo start` to pick up the new env. The first request after a cold start (no traffic for 15+ min) takes ~30s as Render spins the dyno up — do a `GET /api/health` from the browser before demoing to warm it.

## 7 · CORS

`CORS_ORIGINS` in production accepts a comma-separated list of allowed origins. For an Expo demo over the LAN/Internet, `*` is fine. The middleware in [`backend/server.js`](../backend/server.js) is permissive by default but is structured so you can tighten it for production.

## 8 · Free-tier gotchas

| Gotcha | Workaround |
|---|---|
| Render dyno sleeps after 15 min idle, ~30s cold start | Hit `/api/health` before demo; consider an UptimeRobot ping every 14 min |
| Mongo M0 free tier doesn't allow `$lookup` in aggregations beyond ≤100MB | Not an issue at our data volume |
| Cloudinary 25 credits/month free | Plenty; one image ≈ 1 credit |
| Stripe test mode never charges real money | Use `4242 4242 4242 4242` only |
| iOS Stripe SDK requires a dev build (not Expo Go) | Run `npx expo run:ios` once for an internal build |

## 9 · Updating the live deploy

```bash
git push origin main     # Render auto-deploys on every push to main
```

Watch the deploy log on the Render dashboard. If it fails, the most common causes are:
- Missed an env var → server crashes on `MONGO_URI is not set`
- Cloudinary creds rejected → uploads return 500
- A dependency added locally but not committed → fix `package.json` and push again
