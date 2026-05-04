# How to Run GemMarket — Step-by-Step Guide for the Team

**Audience:** the 6 group members who just received the WMT folder via WhatsApp.

**Goal:** get the mobile app running on your phone in about 10 minutes.

> **Good news:** the backend is already live on the internet (`https://wmt-a.onrender.com`). You only need to run the mobile app. You **don't** need MongoDB, Stripe, or Cloudinary credentials. You **don't** need to run a server.

---

## What you'll do (the big picture)

1. **Install** Node.js, Git, and the Expo Go app on your phone — a one-time setup.
2. **Open** the `WMT` folder in VS Code.
3. **Install** the project's dependencies with `npm install`.
4. **Set** the API URL in a `.env` file.
5. **Start** the app with `npx expo start`.
6. **Scan** the QR code with your phone — done.

Each step below explains **what to do** and **why you're doing it**. If you get an error, jump to the **"Common errors"** section near the bottom.

---

## Step 1 — Install the tools

You only do this once on your computer.

### Node.js

**Why:** the project is built with JavaScript. Node is the runtime that runs JavaScript.

- Go to https://nodejs.org/
- Click the green **LTS** button (currently 20 LTS or similar)
- Run the installer with all default options
- Open a terminal (macOS: Terminal app; Windows: PowerShell) and type `node --version` — you should see something like `v20.11.0`. If yes, Node is installed.

### Git

**Why:** if you want to pull updates from GitHub instead of getting a new ZIP every time.

- Go to https://git-scm.com/downloads
- Run the installer with default options
- In a terminal, `git --version` should print a number.

> If you only got the WhatsApp ZIP and don't plan to pull updates, you can skip Git for now.

### Expo Go (on your phone)

**Why:** Expo Go is the app that runs your React Native code on a real phone without needing Xcode/Android Studio.

- iPhone → App Store → search "Expo Go" → install
- Android → Play Store → search "Expo Go" → install

### VS Code (recommended editor)

**Why:** lets you read the code with syntax highlighting and edit it easily.

- https://code.visualstudio.com/
- Default install is fine.

---

## Step 2 — Get the code onto your computer

If your team leader shared a ZIP via WhatsApp:
- Unzip it somewhere easy to find — e.g. `~/Desktop/WMT` (macOS) or `C:\Users\YOU\Desktop\WMT` (Windows).

If you have GitHub access and Git installed:
```bash
git clone https://github.com/IT24103817/WMT_A.git WMT
```

You should now have a folder called `WMT` with `backend/` and `mobile/` inside it.

---

## Step 3 — Install the project dependencies

**Why:** the code uses many packages (React Native, axios, Stripe SDK, etc.). They're listed in `package.json` but not included in the ZIP — you have to download them.

Open your terminal:
```bash
cd ~/Desktop/WMT/mobile
npm install --legacy-peer-deps
```

(On Windows, use `cd C:\Users\YOU\Desktop\WMT\mobile`.)

**What `--legacy-peer-deps` means:** one of our packages (`multer-storage-cloudinary`) was made when npm rules were stricter. The flag tells npm to be lenient. Without it, install fails. We saved this in `.npmrc` so you only have to remember it the first time.

This downloads about 600 MB and takes 1–2 minutes. When it finishes, you'll see `node_modules/` appear inside `mobile/`.

> **DO NOT** open or edit anything inside `node_modules/`. It's just downloaded code.

---

## Step 4 — Set the API URL

**Why:** the app needs to know where the backend lives. We don't hardcode it because the URL might change. Instead it lives in a file called `.env`.

In the `mobile/` folder, you'll see a file called `.env.example`. Copy it:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Open the new `mobile/.env` file in VS Code. It should look like:

```
EXPO_PUBLIC_API_URL=https://wmt-a.onrender.com
EXPO_PUBLIC_STRIPE_PK=pk_test_xxxxxxxxxxxxxxxxxxxx
```

The `EXPO_PUBLIC_API_URL` is already correct — it points at our live Render backend.

The `EXPO_PUBLIC_STRIPE_PK` (Stripe publishable key) is needed for card payments. **Get the actual value from the team WhatsApp group** and replace the `pk_test_xxx...` placeholder.

> The `.env` file is **gitignored** — it never gets pushed to GitHub. That's why we share it via WhatsApp instead.

---

## Step 5 — Start the app

Back in the terminal (still inside `mobile/`):

```bash
npx expo start
```

After a few seconds you'll see a QR code in the terminal and a menu like:

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Press r │ reload app
```

**Pick how to run it:**

| You want to use… | Do this |
|---|---|
| **Your iPhone** | Open the Camera app, scan the QR. A banner says "Open in Expo Go" — tap it. |
| **Your Android phone** | Open the Expo Go app, tap **Scan QR Code**, scan. |
| **iOS simulator** (Mac only) | Press `i` in the terminal. (You need Xcode installed.) |
| **Android emulator** | Boot a virtual device in Android Studio first, then press `a`. |
| **Web browser** | Press `w`. (Some features like Stripe and image picker behave differently on web — don't rely on it for the demo.) |

The first time, downloading the JavaScript bundle takes ~30 seconds. After that, edits reload instantly.

### Test logins

Once the app is running, use these accounts to log in:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@gemmarket.local` | (ask in WhatsApp group) |
| **Customer** | `customer@demo.local` | `password` |
| **Customer 2** | `customer2@demo.local` | `password` |

For card payments, the Stripe test card is **`4242 4242 4242 4242`** with any future date and any 3-digit CVC. This is fake — no real money moves.

---

## Common errors and how to fix them

### "Network request failed" or login spinner hangs forever

**What's happening:** either the API URL is wrong, or the Render backend is asleep. Render's free tier sleeps after 15 minutes of no traffic, and the first request takes ~30s to wake it up.

**Fix:** open `https://wmt-a.onrender.com/api/health` in your browser. If you see `{"ok":true}`, the backend is awake — try the app again. If your browser says "loading…" for 30 seconds and then it works, the backend was just waking up.

### "Unable to resolve module …"

**What's happening:** Metro bundler has a stale cache.

**Fix:**
```bash
npx expo start -c
```
The `-c` clears the cache and rebuilds the bundle.

### "Reanimated NativeWorklets HostFunction error" (iOS)

**What's happening:** the version of `react-native-reanimated` in the project doesn't match what's bundled in Expo Go on your phone.

**Fix:**
```bash
npx expo install react-native-reanimated react-native-worklets
npx expo start -c
```

### "Could not connect to development server"

**What's happening:** your phone and your laptop are on different Wi-Fi networks, or a network firewall is blocking them.

**Fix:** make sure both are on the same Wi-Fi. Corporate / dorm networks often block the connection — try your phone hotspot.

### Image picker shows nothing / asks for permission

**What's happening:** Expo Go doesn't have permission to read your photos.

**Fix:** Settings app → Expo Go → Photos → **Allow All Photos** (or similar on Android).

### Card payment screen loops forever

**What's happening:** `EXPO_PUBLIC_STRIPE_PK` is wrong or missing.

**Fix:** copy the correct key from the WhatsApp group into `mobile/.env`, then `npx expo start -c`.

### Port 8081 in use

**What's happening:** another Metro instance is already running.

**Fix:**
```bash
# macOS / Linux:
lsof -i :8081
kill -9 <pid>

# Windows:
netstat -ano | findstr :8081
taskkill /PID <pid> /F
```

### "Cannot find module '@react-navigation/...'"

**What's happening:** you didn't run step 3 (npm install) inside `mobile/`.

**Fix:** `cd mobile && npm install --legacy-peer-deps`.

### Linux: "ENOSPC: System limit for number of file watchers reached"

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Where to find your module's code (for viva)

Open VS Code, then:

| Member | Module | Files to open |
|---|---|---|
| **Group** | Auth | `backend/controllers/authController.js`, `backend/middleware/auth.js`, `mobile/src/screens/auth/`, `mobile/src/context/AuthContext.js` |
| **M1** | Inventory | `backend/controllers/inventoryController.js`, `backend/models/Gem.js`, `mobile/src/screens/inventory/` |
| **M2** | Learning Hub | `backend/controllers/learningController.js`, `backend/models/Article.js`, `mobile/src/screens/learning/` |
| **M3** | Marketplace + Offers | `backend/controllers/marketplaceController.js`, `backend/controllers/offerController.js`, `mobile/src/screens/marketplace/`, `mobile/src/context/CartContext.js` |
| **M4** | Orders + Reviews | `backend/controllers/orderController.js`, `backend/controllers/reviewController.js`, `mobile/src/screens/orders/`, `mobile/src/screens/reviews/` |
| **M5** | Bidding | `backend/controllers/bidController.js`, `backend/utils/lazyCloseBids.js`, `backend/utils/lazyOpenBids.js`, `mobile/src/screens/bidding/` |
| **M6** | Payment + Cloudinary | `backend/controllers/checkoutController.js`, `backend/utils/finalizeSale.js`, `backend/middleware/upload.js`, `mobile/src/screens/cart/`, `mobile/src/screens/payment/` |

> **Every important file has a comment at the top** explaining what it does, what each function is for, and what gets validated. Open the file and read the first 10–30 lines — it's like a built-in cheatsheet.

For more depth see:
- [`COMPONENTS.md`](COMPONENTS.md) — the per-module CRUD breakdown with file paths
- [`VIVA_CHEATSHEET.md`](VIVA_CHEATSHEET.md) — sample questions + plain-English answers

---

## Optional: Run the backend yourself

You only need this if you want to debug the API or change schemas during viva prep. **For a normal demo, skip this entire section** — use the live Render URL.

```bash
cd backend
npm install --legacy-peer-deps
cp .env.example .env
```

Open `backend/.env` and fill in the values from the WhatsApp group:

```
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=any-long-random-string
JWT_EXPIRES_IN=7d
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@gemmarket.local
ADMIN_PASSWORD=...
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

(Optional) Seed demo gems + customers + orders:
```bash
npm run seed:demo
```

Run the server:
```bash
npm run dev
```

You should see:
```
MongoDB connected
GemMarket API listening on :5001
```

Then in `mobile/.env` change the URL to point at your laptop. **Don't use `localhost`** — your phone can't reach that. Find your computer's IP:

- macOS: `ipconfig getifaddr en0`
- Windows: `ipconfig` → look for "IPv4" of your Wi-Fi adapter
- Linux: `hostname -I | awk '{print $1}'`

Use the result like this:
```
EXPO_PUBLIC_API_URL=http://192.168.1.42:5001
```

Restart Expo: `npx expo start -c`. Now your phone talks to your laptop instead of Render.

---

## If something goes wrong and the docs don't help

1. Read the **error message** carefully. 80% of errors literally tell you what's wrong.
2. Check the **terminal where `npx expo start` is running** — it shows JS errors as they happen.
3. Restart with cache clear: `npx expo start -c`.
4. Restart your phone's Expo Go app.
5. If still stuck, screenshot the error and paste in the WhatsApp group with the file you were on.

You've got this — the system is set up to be forgiving. The only step that absolutely must work is `npm install --legacy-peer-deps`. Everything else is recoverable.
