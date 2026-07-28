const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('crypto');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ensureDirSync } = require('../utils/fileSystem');

// Ensure upload & output directories exist before file operations
ensureDirSync(config.storage.uploadDir);
ensureDirSync(config.storage.outputDir);

/**
 * Configure Multer Storage Engine
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storage.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * Filter uploaded files by MIME type & file extension
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type (${file.mimetype}). Allowed image formats are JPEG, PNG, and WebP.`
      ),
      false
    );
  }
};

/**
 * Multer upload instance
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage.maxFileSizeMB * 1024 * 1024, // Convert MB to Bytes
  },
});

/**
 * Middleware wrapper for single image upload field ('image')
 * Handles Multer specific error codes (e.g. LIMIT_FILE_SIZE) cleanly.
 */
const uploadSingleImage = (req, res, next) => {
  const singleUpload = upload.single('image');

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          ApiError.payloadTooLarge(
            `File size exceeds maximum allowed limit of ${config.storage.maxFileSizeMB}MB`
          )
        );
      }
      return next(ApiError.badRequest(`Upload Error: ${err.message}`));
    } else if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(ApiError.badRequest('Please upload an image file (form field: "image")'));
    }

    next();
  });
};

module.exports = {
  uploadSingleImage,
};
