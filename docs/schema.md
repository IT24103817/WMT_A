# Database Schema Reference

All collections live in MongoDB Atlas, database name `gemmarket`. `_id` is auto-generated; `createdAt` / `updatedAt` come from `{ timestamps: true }`.

## users

Owned by: **Auth (group)** · File: [backend/models/User.js](../backend/models/User.js)

| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `email` | String | required, unique, lowercased |
| `passwordHash` | String | bcrypt hash (cost 10) — never returned to client |
| `role` | enum | `customer` (default) \| `admin` |

`toJSON()` is overridden to strip `passwordHash` from any serialised output.

## gems (inventory)

Owned by: **M1** · File: [backend/models/Gem.js](../backend/models/Gem.js)

| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `type` | String | required — Sapphire / Ruby / Emerald / … |
| `colour` | String | required |
| `carats` | Number | ≥ 0 |
| `stockQty` | Number | ≥ 0 |
| `isAvailable` | Boolean | derived from `stockQty > 0` (pre-save hook) |

## articles

Owned by: **M2** · File: [backend/models/Article.js](../backend/models/Article.js)

| Field | Type | Notes |
|---|---|---|
| `title` | String | required |
| `category` | enum | `Gem Types` \| `Buying Guide` \| `Grading & Quality` \| `Care & Maintenance` |
| `body` | String | required |
| `coverImageUrl` | String | Cloudinary URL |
| `coverImagePublicId` | String | Cloudinary public ID — for delete |
| `publishedAt` | Date | default now |

## listings

Owned by: **M3** · File: [backend/models/Listing.js](../backend/models/Listing.js)

| Field | Type | Notes |
|---|---|---|
| `gem` | ObjectId | ref `Gem` |
| `price` | Number | ≥ 0 |
| `description` | String | required |
| `photos` | [String] | Cloudinary URLs |
| `videoUrl` | String | optional Cloudinary URL |
| `openForOffers` | Boolean | default false |
| `status` | enum | `active` (default) \| `sold` \| `removed` |

## offers

Owned by: **M3** · File: [backend/models/Offer.js](../backend/models/Offer.js)

| Field | Type | Notes |
|---|---|---|
| `listing` | ObjectId | ref `Listing` |
| `gem` | ObjectId | ref `Gem` (denormalised for queries) |
| `customer` | ObjectId | ref `User` |
| `amount` | Number | ≥ 0 |
| `status` | enum | `pending` (default) \| `accepted` \| `rejected` |

Index on `(listing, customer)` for fast "my offers" lookups.

## bids

Owned by: **M5** · File: [backend/models/Bid.js](../backend/models/Bid.js)

| Field | Type | Notes |
|---|---|---|
| `gem` | ObjectId | ref `Gem` |
| `startPrice` | Number | floor for the first valid bid |
| `endTime` | Date | when the auction closes |
| `currentHighest` | `{ amount, customer }` | embedded; `customer` ref `User` |
| `history` | [{ customer, amount, placedAt }] | append-only log |
| `status` | enum | `active` \| `closed` \| `cancelled` |
| `winner` | ObjectId | ref `User`, set by `lazyCloseBids` when status flips to `closed` |

## orders

Owned by: **M4** · File: [backend/models/Order.js](../backend/models/Order.js)

| Field | Type | Notes |
|---|---|---|
| `orderNumber` | String | unique, format `GM-<base36ts>-<RAND>` |
| `customer` | ObjectId | ref `User` |
| `gem` | ObjectId | ref `Gem` |
| `listing` / `bid` / `offer` | ObjectId | only one set, depending on `source` |
| `source` | enum | `direct` \| `offer` \| `bid` |
| `amount` | Number | what the customer actually paid |
| `payment` | ObjectId | ref `Payment` (always set — orders don't exist before payment succeeds) |
| `status` | enum | `Confirmed` (default) \| `Processing` \| `Out for Delivery` \| `Delivered` \| `Cancelled` |

## reviews

Owned by: **M4** · File: [backend/models/Review.js](../backend/models/Review.js)

| Field | Type | Notes |
|---|---|---|
| `gem` | ObjectId | ref `Gem` |
| `order` | ObjectId | ref `Order` |
| `customer` | ObjectId | ref `User` |
| `rating` | Number | 1-5 |
| `comment` | String | optional |

Compound unique index on `(order, customer)` — one review per order per customer.

## payments

Owned by: **M6** · File: [backend/models/Payment.js](../backend/models/Payment.js)

| Field | Type | Notes |
|---|---|---|
| `customer` | ObjectId | ref `User` |
| `gem` | ObjectId | ref `Gem` |
| `amount` | Number | server-derived, never trusted from client |
| `stripeRef` | String | Stripe `paymentIntent.id` |
| `status` | enum | `success` \| `failed` |
| `source` | enum | `direct` \| `offer` \| `bid` |
| `sourceId` | ObjectId | corresponds to listing/offer/bid |

Card details never touch this DB.
