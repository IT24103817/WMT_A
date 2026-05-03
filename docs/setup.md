# GemMarket — Local Setup Guide

This walks you from a clean machine to a running backend + Expo app pointing at your own MongoDB / Cloudinary / Stripe.

> If you only need to run something already deployed, jump to the **Mobile only** section at the bottom.

## 1 · Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 18+ | Backend runtime + Expo CLI |
| npm | 9+ | Package manager (ships with Node) |
| Git | any | Clone the repo |
| Expo Go app | latest | Run the mobile app on your phone via QR code |

For the **payment screen**, Expo Go won't work on iOS because `@stripe/stripe-react-native` is a native module. You'll need a development build (`npx expo prebuild` + `npx expo run:ios` / `run:android`) or skip Stripe testing on iOS.

## 2 · Clone and install

```bash
git clone <your-repo-url> gemmarket
cd gemmarket
cd backend && npm install
cd ../mobile && npm install
```

## 3 · MongoDB Atlas (you already have an account)

1. Atlas → your cluster → **Connect** → **Drivers** → copy the SRV string (looks like `mongodb+srv://user:pass@cluster.xxxx.mongodb.net/`)
2. Append `gemmarket` as the database name: `…/gemmarket?retryWrites=true&w=majority`
3. **Network Access** → Add IP → `0.0.0.0/0` (allow from anywhere — fine for academic project)
4. Drop it into `backend/.env` as `MONGO_URI`

## 4 · Cloudinary (you'll create this)

1. Go to https://cloudinary.com/users/register/free → sign up free
2. Dashboard → **Account Details** card → copy three values:
   - Cloud name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`
3. Paste into `backend/.env`. That's it — no folder setup needed; the backend creates `gemmarket/articles` and `gemmarket/listings` folders on first upload.

**Free tier:** 25 monthly credits (plenty for a demo). Each image upload = ~1 credit.

## 5 · Stripe test mode (you'll create this)

1. Go to https://dashboard.stripe.com/register → sign up (no business details needed for test mode)
2. Make sure the toggle in the top-left says **Test mode** (orange badge)
3. **Developers** → **API keys** → reveal:
   - Secret key (`sk_test_…`) → `STRIPE_SECRET_KEY` in `backend/.env`
   - Publishable key (`pk_test_…`) → `STRIPE_PUBLISHABLE_KEY` in `backend/.env` AND `EXPO_PUBLIC_STRIPE_PK` in `mobile/.env`

**Test card to use everywhere:** `4242 4242 4242 4242`, any future expiry, any 3-digit CVC, any zip.

## 6 · Backend `.env`

```bash
cd backend
cp .env.example .env
# fill in the values you collected in steps 3-5
```

Also set:
- `JWT_SECRET` — any long random string (`openssl rand -hex 32` is easy)
- `ADMIN_PASSWORD` — what you want to use for the seeded admin login

## 7 · Seed the admin user

```bash
cd backend
npm run seed:admin
```

Output: `Admin user ready: admin@gemmarket.local (role=admin)`

You can now log in to the mobile app as `admin@gemmarket.local` / whatever you set in `ADMIN_PASSWORD`.

## 8 · Run the backend

```bash
cd backend
npm run dev    # auto-reloads on save (uses nodemon)
# or
npm start      # plain node
```

Sanity-check at http://localhost:5000/api/health → should return `{"status":"ok",…}`.

## 9 · Mobile `.env`

```bash
cd mobile
cp .env.example .env
```

Edit:
- `EXPO_PUBLIC_API_URL=http://YOUR-LAN-IP:5000` — **not** `localhost`. Your phone needs your computer's LAN IP (e.g. `http://192.168.1.42:5000`). Find it with `ifconfig | grep "inet "` on Mac.
- `EXPO_PUBLIC_STRIPE_PK=pk_test_…` — same key as backend's `STRIPE_PUBLISHABLE_KEY`

## 10 · Run the mobile app

```bash
cd mobile
npx expo start
```

Scan the QR code with the Expo Go app (Android) or the Camera app (iOS). On iOS, the payment screen will throw because Stripe is a native module — that's expected in Expo Go. Use `npx expo run:ios` from a Mac with Xcode for a dev build that supports Stripe.

## Mobile only (against deployed backend)

If you just want to run the app against the already-deployed Render backend:

```bash
cd mobile
npm install
echo "EXPO_PUBLIC_API_URL=https://gemmarket-api.onrender.com" > .env
echo "EXPO_PUBLIC_STRIPE_PK=pk_test_…" >> .env
npx expo start
```

Render's free tier sleeps after 15 minutes of inactivity, so the first request after a cold start may take ~30 seconds. Do a `GET /api/health` once before demoing.
