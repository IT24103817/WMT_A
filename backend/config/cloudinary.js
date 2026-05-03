const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function makeStorage(folder, resourceType = 'auto') {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `gemmarket/${folder}`,
      resource_type: resourceType,
      // Cloudinary auto-converts heic/heif/avif uploads to jpg. We let it accept
      // a generous list because iOS sends heic by default for camera photos.
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif', 'mp4', 'mov', 'm4v', 'webm'],
    },
  });
}

module.exports = { cloudinary, makeStorage };
