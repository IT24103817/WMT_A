/**
 * LAZY-CLOSE BIDS (Module M5)
 * ===========================
 *
 * What it does:
 *   Finds every 'active' bid whose endTime has passed and flips it to
 *   'closed', recording the current highest bidder as the winner.
 *
 * Why "lazy"?
 *   Render's free tier doesn't run scheduled jobs (cron). Instead we call
 *   this function at the START of every bid read or place. So a bid only
 *   becomes officially "closed" the next time someone looks at it.
 *
 * Trade-off:
 *   The DB field can briefly disagree with reality (auction is over but
 *   shows 'active') until someone reads. For an academic system that's
 *   acceptable — documented in the viva cheatsheet.
 *
 * Returns: number of bids that just closed (used for logging/debug).
 */

const Bid = require('../models/Bid');

async function lazyCloseBids() {
  const now = new Date();
  // Pull all ACTIVE bids whose deadline has passed.
  const expired = await Bid.find({ status: 'active', endTime: { $lte: now } });

  for (const bid of expired) {
    bid.status = 'closed';
    // The highest bidder becomes the winner. May be null if nobody bid.
    bid.winner = bid.currentHighest?.customer || null;
    await bid.save();
  }
  return expired.length;
}

module.exports = lazyCloseBids;
