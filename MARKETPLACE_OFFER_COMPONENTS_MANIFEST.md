# Marketplace & Offer Components - Git Push Manifest

**Purpose:** Complete list of all files included in the Marketplace & Offer components to be pushed to GitHub.
**Date:** May 3, 2026
**Structure:** Only marketplace and offer-related files across backend, mobile frontend, E2E tests, and documentation.

---

## 📋 COMPLETE FILE STRUCTURE FOR GITHUB PUSH

```
WMT/
├── backend/
│   ├── controllers/
│   │   ├── marketplaceController.js      [Core marketplace logic: create, read, update, delete listings]
│   │   ├── offerController.js            [Negotiation offers: create, accept, reject]
│   │   ├── paymentController.js          [Payment processing for marketplace sales]
│   │   ├── orderController.js            [Order management from marketplace purchases]
│   │   └── inventoryController.js        [Gem inventory for marketplace listings]
│   │
│   ├── models/
│   │   ├── Listing.js                    [MongoDB schema: marketplace listings with gem, price, photos, video]
│   │   ├── Offer.js                      [MongoDB schema: negotiation offers linked to listings]
│   │   ├── Gem.js                        [MongoDB schema: gem inventory items]
│   │   ├── Order.js                      [MongoDB schema: orders created from marketplace sales]
│   │   ├── Payment.js                    [MongoDB schema: payment records with Stripe integration]
│   │   ├── User.js                       [MongoDB schema: users (customers, admins)]
│   │   ├── Review.js                     [MongoDB schema: customer reviews on purchases]
│   │   └── Bid.js                        [MongoDB schema: bidding/auction alternative]
│   │
│   ├── routes/
│   │   ├── marketplace.js                [API routes: GET, POST, PUT, DELETE /api/marketplace]
│   │   ├── offers.js                     [API routes: POST, GET, PATCH /api/offers]
│   │   ├── payments.js                   [API routes: POST /api/payments]
│   │   └── orders.js                     [API routes: GET, PATCH /api/orders]
│   │
│   ├── middleware/
│   │   ├── upload.js                     [Cloudinary file upload middleware for listing photos/videos]
│   │   ├── auth.js                       [JWT authentication for protected endpoints]
│   │   └── adminOnly.js                  [Admin authorization middleware]
│   │
│   ├── config/
│   │   ├── cloudinary.js                 [Cloudinary media storage configuration]
│   │   └── db.js                         [MongoDB Atlas connection setup]
│   │
│   ├── utils/
│   │   ├── finalizeSale.js               [🔑 CRITICAL: Atomic transaction after payment - decrements stock, marks listing sold, creates order]
│   │   ├── generateOrderNumber.js        [Order number generator (format: GM-<base36ts>-<RAND>)]
│   │   └── lazyCloseBids.js              [Background utility for closing expired auctions]
│   │
│   ├── package.json                      [Dependencies: express, mongoose, stripe, cloudinary, multer, jsonwebtoken]
│   └── server.js                         [Express server setup with route mounting]
│
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── marketplace/
│   │   │   │   ├── MarketplaceScreen.js      [Browse all listings, search, filter by price]
│   │   │   │   ├── GemDetailScreen.js        [Detailed listing view, reviews, photo gallery, "Make Offer" button]
│   │   │   │   ├── ListingFormScreen.js      [Admin: create/edit listings with photo/video picker]
│   │   │   │   ├── AdminListingsScreen.js    [Admin dashboard: manage all listings (CRUD)]
│   │   │   │   └── MakeOfferScreen.js        [Customer: submit negotiation offer with custom amount]
│   │   │   │
│   │   │   ├── offers/
│   │   │   │   ├── CustomerOffersScreen.js   [Customer's submitted offers with status tracking]
│   │   │   │   └── AdminOffersScreen.js      [Admin: review and accept/reject all offers]
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── OrderDetailScreen.js      [Order tracking from marketplace purchases]
│   │   │   │   └── AdminOrdersScreen.js      [Admin order management]
│   │   │   │
│   │   │   └── payment/
│   │   │       └── PaymentScreen.js          [Checkout for marketplace purchases with Stripe]
│   │   │
│   │   ├── api/
│   │   │   ├── client.js                     [Axios HTTP client with JWT token interceptor]
│   │   │   └── index.js                      [API method exports: marketplace, offers, orders, payments]
│   │   │
│   │   ├── components/
│   │   │   ├── Card.js                       [Listing display cards]
│   │   │   ├── Button.js                     [Standard action buttons]
│   │   │   ├── GradientButton.js             ["Make Offer", "New Listing" buttons]
│   │   │   ├── Badge.js                      [Price and status badges]
│   │   │   ├── StarRating.js                 [Gem ratings display]
│   │   │   ├── RatingBadge.js                [Aggregate ratings]
│   │   │   ├── PhotoLightbox.js              [Multi-photo gallery for listings]
│   │   │   ├── Input.js                      [Form inputs for price, description, offer amount]
│   │   │   ├── Chip.js                       [Gem type/category selection]
│   │   │   ├── EmptyState.js                 [Empty list fallbacks]
│   │   │   ├── Toast.js                      [User notifications (success/error/info)]
│   │   │   ├── Screen.js                     [Safe area wrapper for all screens]
│   │   │   ├── AnimatedListItem.js           [Animated list rendering]
│   │   │   └── StatusTracker.js              [Order/offer status visualization]
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js                [User authentication state]
│   │   │
│   │   ├── stripe/
│   │   │   ├── index.native.js               [Native payment handling (re-exports @stripe/stripe-react-native)]
│   │   │   └── index.web.js                  [Web stub (no Stripe support on web)]
│   │   │
│   │   ├── theme.js                          [Design tokens: colors, spacing, typography, shadows]
│   │   ├── App.js                            [React Native app entry point]
│   │   └── babel.config.js                   [Babel configuration]
│   │
│   ├── package.json                          [Dependencies: expo, react-native, stripe, axios, etc.]
│   ├── app.json                              [Expo app configuration]
│   └── assets/                               [App images and icons]
│
├── e2e/
│   ├── tests/
│   │   ├── 03-marketplace-browse.spec.js     [E2E: listing creation, browsing, detail view]
│   │   └── 04-offers-flow.spec.js            [E2E: offer submission, admin acceptance, tracking]
│   │
│   ├── package.json                          [Playwright and testing dependencies]
│   └── playwright.config.js                  [Playwright test configuration]
│
├── docs/
│   ├── schema.md                             [Database schema: Listing, Offer, Order, Payment, Gem models]
│   └── GemMarket — Full Component Workflow Docu.md  [Architecture and workflow documentation]
│
├── MARKETPLACE_OFFER_COMPONENTS_MANIFEST.md  [This file - component manifest]
├── .gitignore                                [Updated to track only marketplace/offer components]
└── README.md                                 [Project documentation]
```

---

## 📊 FILE SUMMARY

| Category | Count | Files |
|----------|-------|-------|
| **Backend Controllers** | 5 | marketplaceController, offerController, paymentController, orderController, inventoryController |
| **Backend Models** | 8 | Listing, Offer, Gem, Order, Payment, User, Review, Bid |
| **Backend Routes** | 4 | marketplace, offers, payments, orders |
| **Backend Middleware** | 3 | upload, auth, adminOnly |
| **Backend Config** | 2 | cloudinary, db |
| **Backend Utils** | 3 | finalizeSale, generateOrderNumber, lazyCloseBids |
| **Backend Root** | 2 | package.json, server.js |
| **Mobile Screens** | 9 | MarketplaceScreen, GemDetailScreen, ListingFormScreen, AdminListingsScreen, MakeOfferScreen, CustomerOffersScreen, AdminOffersScreen, OrderDetailScreen, AdminOrdersScreen, PaymentScreen |
| **Mobile API** | 2 | client, index |
| **Mobile Components** | 14 | Card, Button, GradientButton, Badge, StarRating, RatingBadge, PhotoLightbox, Input, Chip, EmptyState, Toast, Screen, AnimatedListItem, StatusTracker |
| **Mobile Context** | 1 | AuthContext |
| **Mobile Stripe** | 2 | index.native, index.web |
| **Mobile Root** | 4 | package.json, app.json, App.js, babel.config.js, theme.js |
| **E2E Tests** | 2 | 03-marketplace-browse, 04-offers-flow |
| **E2E Root** | 2 | package.json, playwright.config.js |
| **Documentation** | 2 | schema.md, GemMarket Workflow Docu |
| **Root** | 2 | .gitignore, README.md |
| **TOTAL** | **72+** | Complete marketplace & offer ecosystem |

---

## 🔗 KEY INTEGRATION POINTS

### Data Flow
```
Gem Inventory → Listing → Offer/Direct Purchase → Payment → Order → Review
```

### Authentication
- JWT tokens required for all modifications
- Customers can create offers and make purchases
- Admins can create/edit/delete listings

### External Integrations
- **Cloudinary**: Media storage for listing photos/videos
- **Stripe**: Payment processing for marketplace sales
- **MongoDB**: Data persistence

### Critical Files
⭐ **backend/utils/finalizeSale.js** — Handles atomic transactions after successful payment:
- Decrements gem stock
- Marks listing as sold
- Rejects competing offers
- Creates order record
- Supports direct, offer, and bid sources

---

## 🔒 Environment Variables Required

Create `.env` file in backend root with:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📥 How to Push to GitHub

1. **Initialize git** (if not already done):
   ```bash
   cd WMT
   git init
   git add .
   git commit -m "feat: marketplace and offer components"
   git branch -M main
   git remote add origin https://github.com/username/repo.git
   git push -u origin main
   ```

2. **Verify .gitignore is working**:
   ```bash
   git status
   # Should only show marketplace/offer component files
   ```

3. **Track only the whitelisted files**:
   ```bash
   git add -f backend/controllers/marketplaceController.js
   # Repeat for each component file to ensure they're tracked
   ```

---

## ✅ What's EXCLUDED (in .gitignore)

- All node_modules/
- All .env files
- iOS/Android native builds
- All other backend controllers/routes not in marketplace ecosystem
- All other frontend screens/components not in marketplace ecosystem
- All other E2E tests
- Build artifacts, logs, coverage reports
- System files (.DS_Store, .vscode/, etc.)

---

## 📝 Notes

- This manifest covers **100% of marketplace and offer functionality**
- All supporting modules (Auth, Payments, Orders, Inventory) are included
- E2E tests validate marketplace and offer flows
- Design system (theme.js) ensures consistent UI across components
- Documentation includes architecture and data schemas
