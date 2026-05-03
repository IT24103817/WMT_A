const Bid = require('../models/Bid');

async function lazyCloseBids() {
  const now = new Date();
  const expired = await Bid.find({ status: 'active', endTime: { $lte: now } });

  for (const bid of expired) {
    bid.status = 'closed';
    bid.winner = bid.currentHighest?.customer || null;
    await bid.save();
  }
  return expired.length;
}

module.exports = lazyCloseBids;
