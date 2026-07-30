/**
 * Native Vercel Serverless Function handler for /api/removebg
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
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'] || process.env.REMOVE_BG_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'rembg.com API Key is missing. Add REMOVE_BG_API_KEY in Vercel Environment Variables or enter key in UI Settings.',
      });
    }

    const size = req.body?.size || 'auto';
    const type = req.body?.type || 'auto';

    const formData = new FormData();
    formData.append('size', size);
    formData.append('type', type);

    if (req.body?.image_file_b64) {
      formData.append('image_file_b64', req.body.image_file_b64);
    } else if (req.body?.image_url) {
      formData.append('image_url', req.body.image_url);
    } else {
      return res.status(400).json({ success: false, error: 'No image data provided.' });
    }

    const apiRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey.trim(),
      },
      body: formData,
    });

    if (!apiRes.ok) {
      const errJson = await apiRes.json().catch(() => ({}));
      const errMsg = errJson.errors ? errJson.errors.map((e) => e.title).join(', ') : apiRes.statusText;
      return res.status(apiRes.status || 400).json({ success: false, error: `rembg.com API Error: ${errMsg}` });
    }

    const arrayBuffer = await apiRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    return res.status(200).json({
      success: true,
      message: 'Background removed successfully via rembg.com API',
      dataUrl: base64Image,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server processing error' });
  }
};
