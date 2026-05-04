const Gem = require('../models/Gem');

exports.list = async (req, res, next) => {
  try {
    const gems = await Gem.find().sort({ createdAt: -1 });
    res.json(gems);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const gem = await Gem.findById(req.params.id);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
    res.json(gem);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, colour, carats, stockQty } = req.body;
    if (!name || !type || !colour || carats == null) {
      return res.status(400).json({ error: 'name, type, colour, carats are required' });
    }
<<<<<<< HEAD
    const gem = await Gem.create({ name, type, colour, carats, stockQty: stockQty ?? 1 });
=======
    const photos = (req.files || []).map((f) => f.path);
    const gem = await Gem.create({
      name,
      type,
      colour,
      carats: Number(carats),
      stockQty: stockQty != null ? Number(stockQty) : 1,
      photos,
    });
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    res.status(201).json(gem);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const gem = await Gem.findById(req.params.id);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
<<<<<<< HEAD
    const fields = ['name', 'type', 'colour', 'carats', 'stockQty'];
    for (const f of fields) if (req.body[f] !== undefined) gem[f] = req.body[f];
=======

    const fields = ['name', 'type', 'colour', 'carats', 'stockQty'];
    for (const f of fields) {
      if (req.body[f] !== undefined) gem[f] = req.body[f];
    }

    // Photo handling: new files REPLACE entirely. `keepPhotos` JSON keeps the listed URLs.
    if (req.files && req.files.length) {
      gem.photos = req.files.map((f) => f.path);
    } else if (req.body.keepPhotos !== undefined) {
      try {
        const keep = JSON.parse(req.body.keepPhotos);
        if (Array.isArray(keep)) gem.photos = keep.filter((u) => typeof u === 'string');
      } catch { /* ignore */ }
    }

>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    await gem.save();
    res.json(gem);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const gem = await Gem.findByIdAndDelete(req.params.id);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
