const Bid = require('../models/Bid');

/**
 * Mirror of lazyCloseBids: any bid in 'scheduled' status whose start time
 * has passed flips to 'active'. Called from every public GET on /api/bids.
 */
async function lazyOpenBids() {
  const now = new Date();
  const due = await Bid.find({
    status: 'scheduled',
    scheduledStartAt: { $lte: now },
  });

  for (const bid of due) {
    bid.status = 'active';
    await bid.save();
  }
  return due.length;
}

module.exports = lazyOpenBids;
