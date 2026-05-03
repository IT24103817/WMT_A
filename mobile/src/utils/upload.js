/**
 * Convert an `expo-image-picker` asset into the `{ uri, name, type }` shape
 * React Native's FormData expects.
 *
 * iOS often returns mimeType: undefined for photos (especially HEIC), and
 * sometimes leaves fileName empty. We infer both from the URI extension so
 * the multipart upload always carries a sane Content-Type and filename.
 */
const MIME_FROM_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
};

export function pickerAssetToFile(asset, fallback = 'image/jpeg') {
  if (!asset) return null;
  const extMatch = (asset.uri || '').match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const inferredMime = MIME_FROM_EXT[ext] || fallback;
  const type = asset.mimeType || asset.type || inferredMime;
  const name = asset.fileName || `upload.${ext}`;
  return { uri: asset.uri, name, type };
}
