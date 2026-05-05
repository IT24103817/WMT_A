const multer = require('multer');
const { makeStorage } = require('../config/cloudinary');

const limits = { fileSize: 25 * 1024 * 1024 }; // 25 MB

// Permissive image filter: accept any image/*. iOS commonly sends image/heic
// and image/heif which the original tight regex rejected. Cloudinary will
// still validate the actual bytes server-side.
const imageFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  cb(new Error(`File type "${file.mimetype}" is not allowed (image/* only)`));
};

const mediaFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  if (/^video\/(mp4|quicktime|x-m4v|webm)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error(`File type "${file.mimetype}" is not allowed`));
};

const articleCoverUpload = multer({
  storage: makeStorage('articles', 'image'),
  limits,
  fileFilter: imageFilter,
}).single('cover');

// NB: photos now live on the Gem (inventory). Listings keep the optional video only.
const listingMediaUpload = multer({
  storage: makeStorage('listings', 'auto'),
  limits,
  fileFilter: mediaFilter,
}).fields([
  { name: 'video', maxCount: 1 },
]);

const reviewPhotosUpload = multer({
  storage: makeStorage('reviews', 'image'),
  limits,
  fileFilter: imageFilter,
}).array('photos', 3);

const gemPhotosUpload = multer({
  storage: makeStorage('gems', 'image'),
  limits,
  fileFilter: imageFilter,
}).array('photos', 6);

// Wrap multer middleware so any error becomes a clean 4xx JSON instead of crashing.
function withUploadErrorHandling(uploader) {
  return (req, res, next) =>
    uploader(req, res, (err) => {
      if (!err) return next();
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.message || 'Upload failed' });
    });
}

module.exports = {
  articleCoverUpload: withUploadErrorHandling(articleCoverUpload),
  listingMediaUpload: withUploadErrorHandling(listingMediaUpload),
  reviewPhotosUpload: withUploadErrorHandling(reviewPhotosUpload),
  gemPhotosUpload: withUploadErrorHandling(gemPhotosUpload),
};
