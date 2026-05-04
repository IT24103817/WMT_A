/**
 * BID CONTROLLER (Module M5)
 * ==========================
 * Module owner: M5 (Bidding / Auctions)
 *
 * What this file does:
 *   Auction-style sales. Admin schedules a bid (now or later) with a start
 *   price and end time. Customers place increasing bids. The winner pays
 *   through /api/checkout with source='bid'.
 *
 * Why "lazy state"?
 *   Render's free tier doesn't run scheduled jobs. Instead of a cron, we
 *   sweep state at the start of every list/get/place call:
 *     - lazyOpenBids → flips 'scheduled' → 'active' when start time arrived
 *     - lazyCloseBids → flips 'active' → 'closed' when end time passed
 *                       (records winner = currentHighest.customer)
 *   Trade-off: a closed auction stays "active" in the DB until someone
 *   reads it. That's documented as an academic-scope decision.
 *
 * Bid lifecycle:
 *   scheduled → active → closed → (winner pays via checkout)
 *   active    → cancelled  (admin pulled it before anyone won)
 */

const Bid = require('../models/Bid');
const Gem = require('../models/Gem');
const lazyCloseBids = require('../utils/lazyCloseBids');
const lazyOpenBids = require('../utils/lazyOpenBids');

// Run before every read/place — opens scheduled bids whose time arrived
// and closes active bids whose time expired.
async function sweep() {
  await lazyOpenBids();
  await lazyCloseBids();
}

/**
 * READ-all → GET /api/bids   (public)
 * Sweeps state first so closed auctions are reflected in the response.
 * Optional ?status=scheduled|active|closed|cancelled filter.
 */
exports.list = async (req, res, next) => {
  try {
    await sweep();
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

/**
 * READ-one → GET /api/bids/:id   (public)
 * Same sweep as list. Populates the bid history with bidder names.
 */
exports.get = async (req, res, next) => {
  try {
    await sweep();
    const bid = await Bid.findById(req.params.id)
      .populate('gem')
      .populate('currentHighest.customer', 'name')
      .populate('winner', 'name')
      .populate('history.customer', 'name');
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    res.json(bid);
  } catch (err) { next(err); }
};

/**
 * CREATE → POST /api/bids   (admin)
 * Validations:
 *   - gemId, startPrice, endTime required
 *   - endTime must be in the future
 *   - if scheduledStartAt provided: must be valid date AND before endTime
 *     (initial status flips to 'scheduled' if scheduled time is in the future)
 *   - referenced gem must exist with stockQty > 0
 */
exports.create = async (req, res, next) => {
  try {
    const { gemId, startPrice, endTime, scheduledStartAt, description } = req.body;
    if (!gemId || startPrice == null || !endTime) {
      return res.status(400).json({ error: 'gemId, startPrice, endTime are required' });
    }
    const end = new Date(endTime);
    if (Number.isNaN(end.getTime()) || end <= new Date()) {
      return res.status(400).json({ error: 'endTime must be a future date' });
    }

    let scheduled = null;
    let initialStatus = 'active';
    if (scheduledStartAt) {
      scheduled = new Date(scheduledStartAt);
      if (Number.isNaN(scheduled.getTime())) {
        return res.status(400).json({ error: 'scheduledStartAt must be a valid date' });
      }
      if (scheduled >= end) {
        return res.status(400).json({ error: 'scheduledStartAt must be before endTime' });
      }
      if (scheduled > new Date()) {
        initialStatus = 'scheduled';
      }
    }

    const gem = await Gem.findById(gemId);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
    if (gem.stockQty <= 0) return res.status(409).json({ error: 'Gem is out of stock' });

    const bid = await Bid.create({
      gem: gem._id,
      description: description || '',
      startPrice: Number(startPrice),
      endTime: end,
      scheduledStartAt: scheduled,
      status: initialStatus,
      currentHighest: { amount: Number(startPrice), customer: null },
    });
    res.status(201).json(await bid.populate('gem'));
  } catch (err) { next(err); }
};

/**
 * UPDATE → PUT /api/bids/:id   (admin)
 * Edits description, endTime, scheduledStartAt. Refuses to edit closed or
 * cancelled auctions (would be unfair to the winner / participants).
 * Convenience flag `goLive: true` flips a scheduled bid to active right
 * away.
 */
exports.update = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status === 'closed' || bid.status === 'cancelled') {
      return res.status(409).json({ error: `Cannot edit a ${bid.status} auction` });
    }

    const { description, endTime, scheduledStartAt, goLive } = req.body;

    if (description !== undefined) bid.description = String(description);

    if (endTime !== undefined) {
      const end = new Date(endTime);
      if (Number.isNaN(end.getTime()) || end <= new Date()) {
        return res.status(400).json({ error: 'endTime must be in the future' });
      }
      bid.endTime = end;
    }

    if (scheduledStartAt !== undefined) {
      if (scheduledStartAt === null || scheduledStartAt === '') {
        // Going live now — clear schedule + flip status
        bid.scheduledStartAt = null;
        if (bid.status === 'scheduled') bid.status = 'active';
      } else {
        const s = new Date(scheduledStartAt);
        if (Number.isNaN(s.getTime())) {
          return res.status(400).json({ error: 'scheduledStartAt must be a valid date' });
        }
        if (s >= bid.endTime) {
          return res.status(400).json({ error: 'scheduledStartAt must be before endTime' });
        }
        bid.scheduledStartAt = s;
        if (s > new Date()) bid.status = 'scheduled';
      }
    }

    // Convenience flag: { goLive: true } from a Schedule → Live edit
    if (goLive === true) {
      bid.scheduledStartAt = null;
      if (bid.status === 'scheduled') bid.status = 'active';
    }

    await bid.save();
    res.json(await bid.populate('gem'));
  } catch (err) { next(err); }
};

/**
 * UPDATE (place a bid) → POST /api/bids/:id/place   (customer)
 * Validations (all 409 if violated):
 *   - bid must be 'active' (not scheduled/closed/cancelled)
 *   - now must be < endTime
 *   - amount must be > current highest (or > startPrice if no bids yet)
 * On success: updates currentHighest and pushes to history[].
 */
exports.place = async (req, res, next) => {
  try {
    await sweep();
    const { amount } = req.body;
    if (amount == null) return res.status(400).json({ error: 'amount is required' });

    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status === 'scheduled') return res.status(409).json({ error: 'This auction has not started yet' });
    if (bid.status !== 'active') return res.status(409).json({ error: 'Bidding is closed' });
    if (new Date() >= bid.endTime) return res.status(409).json({ error: 'Bidding has ended' });

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

/**
 * DELETE → DELETE /api/bids/:id   (admin)
 * Soft-cancel: flips status to 'cancelled'. Closed bids cannot be deleted —
 * a winner has already been declared.
 */
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
