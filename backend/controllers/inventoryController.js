/**
 * INVENTORY CONTROLLER (Module M1)
 * ================================
 * Module owner: M1
 *
 * What this file does:
 *   Admin-only CRUD for the Gem catalog. A "Gem" is the SKU — every listing,
 *   bid, and order references a Gem document for its specs (name, type,
 *   colour, carats) and photos.
 *
 * Why admin-only?
 *   The catalog is the spine of the marketplace. If customers could mutate
 *   it, every other module would break. The route file wraps these handlers
 *   with [auth, adminOnly] middleware (see routes/inventory.js).
 *
 * Where photos live:
 *   On the Gem itself (gem.photos[]). Listings, orders, and bids do NOT
 *   store their own photos — they read from the gem via the
 *   `listingPhoto()` helper on the mobile side (mobile/src/utils/photo.js).
 */

const Gem = require('../models/Gem');

/**
 * READ-all → GET /api/inventory
 * Returns every gem, newest first.
 */
exports.list = async (req, res, next) => {
  try {
    const gems = await Gem.find().sort({ createdAt: -1 });
    res.json(gems);
  } catch (err) { next(err); }
};

/**
 * READ-one → GET /api/inventory/:id
 * 404s if the gem doesn't exist.
 */
exports.get = async (req, res, next) => {
  try {
    const gem = await Gem.findById(req.params.id);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
    res.json(gem);
  } catch (err) { next(err); }
};

/**
 * CREATE → POST /api/inventory
 * Multipart form: text fields + up to 6 photos uploaded to Cloudinary.
 *
 * Validations:
 *   - name, type, colour, carats are required
 *   - carats must be a number (mongoose coerces)
 *   - stockQty defaults to 1 if not given (mongoose schema also enforces ≥ 0)
 */
exports.create = async (req, res, next) => {
  try {
    const { name, type, colour, carats, stockQty } = req.body;
    // Required-field check (defense in depth — schema also validates).
    if (!name || !type || !colour || carats == null) {
      return res.status(400).json({ error: 'name, type, colour, carats are required' });
    }
    // multer-storage-cloudinary already uploaded the files. f.path is the
    // public Cloudinary URL we want to store on the gem document.
    const photos = (req.files || []).map((f) => f.path);
    const gem = await Gem.create({
      name,
      type,
      colour,
      carats: Number(carats),
      stockQty: stockQty != null ? Number(stockQty) : 1,
      photos,
    });
    res.status(201).json(gem);
  } catch (err) { next(err); }
};

/**
 * UPDATE → PUT /api/inventory/:id
 * Edits any of name/type/colour/carats/stockQty. Photo handling has two modes:
 *   - If the request includes new files, they REPLACE the photos array.
 *   - Otherwise, if `keepPhotos` (JSON array of URLs) is provided, only those
 *     stay. This is how the mobile form supports "remove existing photos".
 */
exports.update = async (req, res, next) => {
  try {
    const gem = await Gem.findById(req.params.id);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });

    // Whitelist editable fields — never mass-assign req.body to the doc.
    const fields = ['name', 'type', 'colour', 'carats', 'stockQty'];
    for (const f of fields) {
      if (req.body[f] !== undefined) gem[f] = req.body[f];
    }

    if (req.files && req.files.length) {
      // New uploads → replace photo set entirely.
      gem.photos = req.files.map((f) => f.path);
    } else if (req.body.keepPhotos !== undefined) {
      // No new uploads → honour the kept-list (lets users delete some photos).
      try {
        const keep = JSON.parse(req.body.keepPhotos);
        if (Array.isArray(keep)) gem.photos = keep.filter((u) => typeof u === 'string');
      } catch { /* malformed JSON → keep existing photos */ }
    }

    // .save() runs schema validators (min/max, enum, required).
    await gem.save();
    res.json(gem);
  } catch (err) { next(err); }
};

/**
 * DELETE → DELETE /api/inventory/:id
 * Hard delete. Existing orders that reference this gem still display via
 * the `gemNameSnapshot` / `photoSnapshot` fields on Order.items, so history
 * isn't broken when admin removes a sold-out gem.
 */
exports.remove = async (req, res, next) => {
  try {
    const gem = await Gem.findByIdAndDelete(req.params.id);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
