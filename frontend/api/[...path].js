import http from 'http';

export const config = {
  api: {
    bodyParser: false, // Disable Vercel bodyParser to stream raw multipart file uploads to EC2
  },
};

export default function handler(req, res) {
  const ec2Host = '3.109.122.52';
  const ec2Port = 5000;

  // Preserve request URL path
  const targetPath = req.url.startsWith('/api') ? req.url : `/api${req.url}`;

  const options = {
    hostname: ec2Host,
    port: ec2Port,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${ec2Host}:${ec2Port}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Vercel EC2 Proxy Error:', err);
    res.status(502).json({
      error: 'EC2 Backend Connection Failed',
      message: err.message,
    });
  });

  req.pipe(proxyReq, { end: true });
}
