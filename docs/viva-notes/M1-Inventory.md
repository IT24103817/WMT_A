# M1 — Inventory (Gem) Module

## Your responsibility
Admin-only CRUD over the `gems` collection. Inventory is the **source of truth** for what physical gems the business owns. Everything else (Listings, Bids, Orders) ultimately references a Gem document.

## Files you own
- [backend/models/Gem.js](../../backend/models/Gem.js)
- [backend/controllers/inventoryController.js](../../backend/controllers/inventoryController.js)
- [backend/routes/inventory.js](../../backend/routes/inventory.js)
- [mobile/src/screens/inventory/AdminInventoryScreen.js](../../mobile/src/screens/inventory/AdminInventoryScreen.js)
- [mobile/src/screens/inventory/InventoryFormScreen.js](../../mobile/src/screens/inventory/InventoryFormScreen.js)

## Schema
```
{ name, type, colour, carats, stockQty, isAvailable }
```
`isAvailable` is **derived** — a `pre('save')` hook flips it to `false` whenever `stockQty` reaches 0. The `pre('findOneAndUpdate')` hook does the same for atomic updates.

## Endpoints (all admin-only)
```
GET    /api/inventory       list all
GET    /api/inventory/:id   get one
POST   /api/inventory       create  { name, type, colour, carats, stockQty }
PUT    /api/inventory/:id   update  (partial)
DELETE /api/inventory/:id   remove
```

The `routes/inventory.js` mounts `auth` + `adminOnly` at the router level, so every method is protected.

## Integration with other modules
- **M3 Marketplace:** `POST /api/marketplace` validates that `gem.stockQty > 0` before allowing a listing
- **M5 Bidding:** same check applies before creating a bid
- **M6 Payment:** `finalizeSale` decrements `gem.stockQty` after every successful payment, so inventory is automatically accurate

## Likely viva questions

**Q: Why is `isAvailable` derived instead of stored independently?**
A: To prevent drift. If both `stockQty` and `isAvailable` were independent writeable fields, an admin could (or a bug could) leave them inconsistent — e.g. stock=0 but available=true. Deriving it inside a Mongoose hook makes inconsistency impossible.

**Q: Can a customer call `GET /api/inventory`?**
A: No — `routes/inventory.js` applies `auth + adminOnly` to **all** methods including reads, because raw stock numbers are business data, not customer-facing. Customers see `Listings` (which expose only the gem properties they need: name, type, colour, carats, photos).

**Q: What if the admin deletes a gem that has open offers / active bids?**
A: The current implementation does a hard `findByIdAndDelete`. In a production system you'd switch to soft-delete with a `deletedAt` field, or refuse the delete if any open `bids` / `listings` reference it. Worth mentioning as a follow-up.

**Q: How does the mobile form handle validation?**
A: Two layers — (1) frontend validation in `InventoryFormScreen.submit()` (numeric coercion via `Number()`, presence checks); (2) backend in the controller still validates required fields and rejects with 400. Server validation is the security boundary; client validation is UX.

## How to demo
1. Log in as admin. Open Inventory tab.
2. Tap **+ Add**, fill in Sapphire / Sapphire / Blue / 2.4 / 1, save.
3. Edit it — change carats to 2.45, save.
4. Try to delete — you get a confirmation dialog.
