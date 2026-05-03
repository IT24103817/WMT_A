/**
 * Resolve the primary thumbnail for a listing.
 *
 * Photos live on the Gem (inventory) now. We still check `listing.photos`
 * first to support legacy data created before the migration.
 */
export function listingPhoto(listing) {
  if (!listing) return null;
  if (listing.photos?.length) return listing.photos[0];
  if (listing.gem?.photos?.length) return listing.gem.photos[0];
  return null;
}

/** All photos to display in a listing gallery (gem + listing-specific photos). */
export function listingGallery(listing) {
  const out = [];
  if (listing?.gem?.photos?.length) out.push(...listing.gem.photos);
  if (listing?.photos?.length) {
    listing.photos.forEach((p) => { if (!out.includes(p)) out.push(p); });
  }
  return out;
}
