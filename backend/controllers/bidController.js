const Bid = require('../models/Bid');
const Gem = require('../models/Gem');
const lazyCloseBids = require('../utils/lazyCloseBids');

exports.list = async (req, res, next) => {
  try {
    await lazyCloseBids();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const bids = await Bid.find(filter)
      .populate('gem')
      .populate('currentHighest.customer', 'name')
      .populate('winner', 'name')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    await lazyCloseBids();
    const bid = await Bid.findById(req.params.id)
      .populate('gem')
      .populate('currentHighest.customer', 'name')
      .populate('winner', 'name')
      .populate('history.customer', 'name');
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    res.json(bid);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { gemId, startPrice, endTime } = req.body;
    if (!gemId || startPrice == null || !endTime) {
      return res.status(400).json({ error: 'gemId, startPrice, endTime are required' });
    }
    const end = new Date(endTime);
    if (Number.isNaN(end.getTime()) || end <= new Date()) {
      return res.status(400).json({ error: 'endTime must be a future date' });
    }
    const gem = await Gem.findById(gemId);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
    if (gem.stockQty <= 0) return res.status(409).json({ error: 'Gem is out of stock' });

    const bid = await Bid.create({
      gem: gem._id,
      startPrice: Number(startPrice),
      endTime: end,
      currentHighest: { amount: Number(startPrice), customer: null },
    });
    res.status(201).json(await bid.populate('gem'));
  } catch (err) { next(err); }
};

exports.place = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (amount == null) return res.status(400).json({ error: 'amount is required' });

    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status !== 'active') return res.status(409).json({ error: 'Bidding is closed' });
    if (new Date() >= bid.endTime) {
      return res.status(409).json({ error: 'Bidding has ended' });
    }

    const newAmount = Number(amount);
    const currentMax = bid.currentHighest?.amount || bid.startPrice;
    if (newAmount <= currentMax) {
      return res.status(400).json({
        error: `Bid must be greater than current highest (${currentMax})`,
      });
    }

    bid.currentHighest = { amount: newAmount, customer: req.user._id };
    bid.history.push({ customer: req.user._id, amount: newAmount });
    await bid.save();

    res.json(bid);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status === 'closed') {
      return res.status(409).json({ error: 'Cannot delete a closed bid' });
    }
    bid.status = 'cancelled';
    await bid.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
};
