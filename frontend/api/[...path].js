import http from 'http';

export const config = {
  api: {
    bodyParser: false, // Disable Vercel bodyParser to stream raw file uploads to EC2
  },
};

export default function handler(req, res) {
  const ec2Host = process.env.EC2_HOST || '13.204.45.189';
  const ec2Port = process.env.EC2_PORT || 5000;

  const targetPath = req.url.startsWith('/api') ? req.url : `/api${req.url}`;

  // Filter headers to prevent socket hangup & connection pool corruption
  const headers = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers[key] = val;
    }
  }
  headers['host'] = `${ec2Host}:${ec2Port}`;

  const options = {
    hostname: ec2Host,
    port: ec2Port,
    path: targetPath,
    method: req.method,
    headers,
    timeout: 30000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Vercel EC2 Proxy Error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'EC2 Backend Connection Failed',
        message: err.message,
      });
    }
  });

  // Only pipe request body stream for data methods (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
}
