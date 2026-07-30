const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Controller to handle background removal via official Remove.bg API
 */
const removeBackgroundAPI = async (req, res, next) => {
  try {
    // Extract API Key from request header or environment variable
    const apiKey = req.headers['x-api-key'] || process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      throw ApiError.badRequest(
        'Remove.bg API Key is missing. Please provide X-Api-Key header or set REMOVE_BG_API_KEY in backend environment.'
      );
    }

    const formData = new FormData();
    const size = req.body.size || 'auto';
    const type = req.body.type || 'auto';

    formData.append('size', size);
    formData.append('type', type);

    // Option 1: File uploaded via multipart form
    if (req.file) {
      formData.append('image_file', req.file.buffer, {
        filename: req.file.originalname || 'image.png',
        contentType: req.file.mimetype || 'image/png',
      });
    }
    // Option 2: Image URL passed in request body
    else if (req.body.image_url) {
      formData.append('image_url', req.body.image_url);
    }
    // Option 3: Base64 data string passed in request body
    else if (req.body.image_file_b64) {
      formData.append('image_file_b64', req.body.image_file_b64);
    } else {
      throw ApiError.badRequest('No image file, image_url, or image_file_b64 provided.');
    }

    logger.info(`Sending image to Remove.bg API (size: ${size}, type: ${type})...`);

    // Call official Remove.bg API endpoint
    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': apiKey,
      },
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Return both JSON format with data URL and binary PNG format based on Accept header
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({
        success: true,
        message: 'Background removed successfully via Remove.bg API',
        dataUrl: base64Image,
      });
    } else {
      res.set('Content-Type', 'image/png');
      return res.status(200).send(imageBuffer);
    }
  } catch (error) {
    if (error.response) {
      let errorDetails = 'Remove.bg API Error';
      try {
        const errorJson = JSON.parse(error.response.data.toString('utf-8'));
        errorDetails = errorJson.errors ? errorJson.errors.map((e) => e.title).join(', ') : errorDetails;
      } catch (e) {
        errorDetails = error.response.statusText || errorDetails;
      }

      logger.error(`Remove.bg API failed: ${error.response.status} - ${errorDetails}`);
      return next(ApiError.badRequest(`Remove.bg API Error: ${errorDetails}`));
    }

    logger.error('Remove.bg processing failed:', error.message);
    return next(error);
  }
};

module.exports = {
  removeBackgroundAPI,
};
