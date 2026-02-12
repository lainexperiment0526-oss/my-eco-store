// Quick CORS proxy solution for Pi SDK development
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8082;

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true
}));

// Proxy Pi SDK requests
app.use('/pi-sdk', createProxyMiddleware({
  target: 'https://sdk.minepi.com',
  changeOrigin: true,
  pathRewrite: {
    '^/pi-sdk': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying: ${req.method} ${req.url} -> https://sdk.minepi.com${req.url.replace('/pi-sdk', '')}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Proxy Pi API requests
app.use('/pi-api', createProxyMiddleware({
  target: 'https://api.minepi.com',
  changeOrigin: true,
  pathRewrite: {
    '^/pi-api': ''
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Pi SDK available at: http://localhost:${PORT}/pi-sdk/pi-sdk.js`);
  console.log(`📡 Pi API available at: http://localhost:${PORT}/pi-api/`);
  console.log('\n💡 Update your index.html to use:');
  console.log(`   <script src="http://localhost:${PORT}/pi-sdk/pi-sdk.js"></script>`);
});

module.exports = app;