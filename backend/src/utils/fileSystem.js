const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Ensures that target directory exists on disk, creates recursively if missing.
 * @param {string} dirPath - Directory path
 */
const ensureDirSync = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created missing directory: ${dirPath}`);
  }
};

/**
 * Safely delete a file from disk if it exists.
 * @param {string} filePath - Absolute file path
 */
const removeFileAsync = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`Deleted file from disk: ${filePath}`);
    }
  } catch (err) {
    logger.error(`Failed to delete file ${filePath}: ${err.message}`);
  }
};

module.exports = {
  ensureDirSync,
  removeFileAsync,
};
