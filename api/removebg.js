const axios = require('axios');
const FormData = require('form-data');

/**
 * Vercel Serverless Function handler for /api/removebg
 */
module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'] || process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Remove.bg API Key is missing. Add REMOVE_BG_API_KEY in Vercel Environment Variables or enter key in UI Settings.',
      });
    }

    const formData = new FormData();
    const size = req.body?.size || 'auto';
    const type = req.body?.type || 'auto';

    formData.append('size', size);
    formData.append('type', type);

    if (req.body?.image_file_b64) {
      formData.append('image_file_b64', req.body.image_file_b64);
    } else if (req.body?.image_url) {
      formData.append('image_url', req.body.image_url);
    } else {
      return res.status(400).json({ success: false, error: 'No image data provided.' });
    }

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': apiKey.trim(),
      },
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    return res.status(200).json({
      success: true,
      message: 'Background removed successfully via Remove.bg API',
      dataUrl: base64Image,
    });
  } catch (error) {
    let errorDetails = 'Remove.bg API processing failed';
    if (error.response) {
      try {
        const errorJson = JSON.parse(error.response.data.toString('utf-8'));
        errorDetails = errorJson.errors ? errorJson.errors.map((e) => e.title).join(', ') : errorDetails;
      } catch (e) {
        errorDetails = error.response.statusText || errorDetails;
      }
      return res.status(error.response.status || 400).json({ success: false, error: errorDetails });
    }

    return res.status(500).json({ success: false, error: error.message || errorDetails });
  }
};
