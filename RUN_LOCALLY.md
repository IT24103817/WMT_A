# GemMarket — How to Run It

This document is for the **6 team members** receiving the WMT folder via WhatsApp.

The simplest path: **only run the mobile app**. The backend is already deployed at our Render URL — your phone/emulator talks to the live API. You don't need MongoDB, Stripe, or Cloudinary credentials. You don't need to run the server.

> If you also want to run the backend locally (for module debugging during your viva prep), follow the **"Optional: Run the backend locally"** section at the bottom.

---

## 1. Prerequisites (install once)

| Tool | Version | How |
|---|---|---|
| **Node.js** | 18 LTS or 20 LTS | https://nodejs.org/ — pick the LTS installer |
| **Git** | any recent | https://git-scm.com/downloads |
| **Expo Go app** | latest | App Store / Play Store on your phone |
| **VS Code** (recommended) | latest | https://code.visualstudio.com/ |

For **iOS simulator** (Mac only): install Xcode from the Mac App Store, then once: `sudo xcode-select --install`.

For **Android emulator**: install Android Studio (https://developer.android.com/studio), open it once, click **More Actions → Virtual Device Manager → Create Device**.

For **web preview**: nothing extra — `npm` will install it.

---

## 2. Get the code

If a teammate sent you the folder via WhatsApp:

```bash
# Unzip the WMT folder somewhere convenient, e.g. ~/Desktop
cd ~/Desktop/WMT
```

Or clone from GitHub:

```bash
git clone https://github.com/IT24103817/WMT_A.git WMT
cd WMT
```

You should see two folders: `backend/` and `mobile/`, plus a few markdown files.

---

## 3. Install mobile dependencies

```bash
cd mobile
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is **required** because of a known peer-dep mismatch in `multer-storage-cloudinary`.

This step downloads ~600 MB into `mobile/node_modules/` and takes ~2 min on a fast connection. If it stalls, kill it (Ctrl+C) and re-run.

---

## 4. Configure the API URL

```bash
# Inside mobile/
cp .env.example .env
```

Open `mobile/.env` and confirm it points at the live Render backend:

```
EXPO_PUBLIC_API_URL=https://<our-render-name>.onrender.com
EXPO_PUBLIC_STRIPE_PK=pk_test_xxxxxxxxxxxxxxxxxxxx
```

> **Get the actual values from Ibrahim** — they're posted in the team WhatsApp group. The `.env` file is gitignored, so it never appears in the repo.

---

## 5. Start the app

```bash
# Still inside mobile/
npx expo start
```

A QR code + a menu appear in the terminal. Pick one:

| Target | What to press / scan |
|---|---|
| **iPhone** | Open Camera, scan QR, tap the Expo Go banner |
| **Android phone** | Open Expo Go app, hit **Scan QR Code** |
| **iOS simulator** | Press `i` in the terminal |
| **Android emulator** | Boot a device in Android Studio first, then press `a` |
| **Web browser** | Press `w` (limited — Stripe and image picker behave differently) |

The first launch downloads the JS bundle (~30s). After that it's instant on reload.

### Test logins (live backend)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@gemmarket.local` | (from WhatsApp group) |
| Customer | `customer@demo.local` | `password` |
| Customer 2 | `customer2@demo.local` | `password` |

Card payments use the Stripe **test card** `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC.

---

## 6. Common errors and fixes

### "Network request failed" or login spinner hangs forever
Your `.env` is wrong, or Render is asleep (free tier sleeps after 15 min idle). Open the API URL in a browser → `https://<render-name>.onrender.com/api/health`. If it loads `{"ok":true}`, retry the app. The first call after sleep can take 30–40s.

### "Unable to resolve module …"
Stale Metro cache. Stop the dev server, then:
```bash
npx expo start -c
```

### iOS: "Reanimated `NativeWorklets` HostFunction error"
Version mismatch with Expo Go. Fix:
```bash
npx expo install react-native-reanimated react-native-worklets
```
Then `npx expo start -c`.

### "ENOSPC: System limit for number of file watchers reached" (Linux)
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### "Stripe SDK requires native module" on iOS Expo Go
Expo Go bundles the Stripe SDK in SDK 54+, so this should not happen. If it does, you're on an outdated Expo Go — update the app from the App Store.

### Image picker shows nothing
Permission denied. Settings → Expo Go → Photos → Allow.

### Card payment screen loops forever
The publishable key (`EXPO_PUBLIC_STRIPE_PK`) is missing or has a typo. Re-copy it from the WhatsApp group, restart `expo start -c`.

### "Cannot find module '@react-navigation/...'"
You skipped step 3. Run `npm install --legacy-peer-deps` inside `mobile/`.

### Port 8081 in use
Another Metro is already running. `lsof -i :8081`, kill it, retry.

### "Could not connect to development server"
Phone and laptop must be on the **same Wi-Fi**. Corporate / dorm networks often block it — switch to a phone hotspot.

---

## 7. Where to find your module's code (for viva)

| Member | Module | Look in |
|---|---|---|
| **Group** | Auth | `backend/controllers/authController.js`, `backend/middleware/auth.js`, `mobile/src/screens/auth/`, `mobile/src/context/AuthContext.js` |
| **M1** | Inventory | `backend/controllers/inventoryController.js`, `backend/models/Gem.js`, `mobile/src/screens/inventory/` |
| **M2** | Learning Hub | `backend/controllers/learningController.js`, `backend/models/Article.js`, `mobile/src/screens/learning/` |
| **M3** | Marketplace + Offers | `backend/controllers/marketplaceController.js`, `backend/controllers/offerController.js`, `backend/models/Listing.js`, `backend/models/Offer.js`, `mobile/src/screens/marketplace/`, `mobile/src/context/CartContext.js` |
| **M4** | Orders + Reviews | `backend/controllers/orderController.js`, `backend/controllers/reviewController.js`, `backend/models/Order.js`, `backend/models/Review.js`, `mobile/src/screens/orders/`, `mobile/src/screens/reviews/` |
| **M5** | Bidding | `backend/controllers/bidController.js`, `backend/models/Bid.js`, `backend/utils/lazyCloseBids.js`, `backend/utils/lazyOpenBids.js`, `mobile/src/screens/bidding/` |
| **M6** | Payment + Cloudinary + Deployment | `backend/controllers/checkoutController.js`, `backend/controllers/paymentController.js`, `backend/utils/finalizeSale.js`, `backend/middleware/upload.js`, `backend/config/cloudinary.js`, `mobile/src/screens/cart/`, `mobile/src/screens/payment/` |

For the full per-component tour with line numbers and validations, see [`COMPONENTS.md`](COMPONENTS.md).

For viva questions (10 per module, with answer hints), see [`VIVA_CHEATSHEET.md`](VIVA_CHEATSHEET.md).

---

## Optional: Run the backend locally

Only needed if you want to debug the API or change schemas during viva prep.

```bash
cd backend
npm install --legacy-peer-deps
cp .env.example .env
```

Open `backend/.env` and fill in:

```
PORT=5001
MONGO_URI=mongodb+srv://...                # ask Ibrahim for the Atlas string
JWT_SECRET=any-long-random-string
JWT_EXPIRES_IN=7d
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@gemmarket.local
ADMIN_PASSWORD=...                          # ask Ibrahim
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
NODE_ENV=development
CORS_ORIGINS=*
```

Seed the admin once:

```bash
npm run seed:admin
```

Optionally seed demo data (4 gems, 2 customers, sample orders + reviews):

```bash
npm run seed:demo
```

Run:

```bash
npm run dev
```

You should see:

```
MongoDB connected
GemMarket API listening on :5001
```

Then in `mobile/.env` switch the URL to `http://<your-laptop-IP>:5001` (NOT `localhost` — your phone can't reach that). Find your IP with:

- macOS: `ipconfig getifaddr en0`
- Windows: `ipconfig` → look for IPv4 of your Wi-Fi adapter
- Linux: `hostname -I | awk '{print $1}'`

Restart Expo with `npx expo start -c`.
