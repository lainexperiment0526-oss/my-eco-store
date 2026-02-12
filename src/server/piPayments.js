require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const API_KEY = process.env.PI_API_KEY;
const BASE_URL = process.env.PI_API_BASE_URL || 'https://api.minepi.com';
// Endpoint to verify rewarded ad status
app.post('/verify-rewarded-ad', async (req, res) => {
  const { adId } = req.body;
  try {
// Endpoint to verify Pi user token
app.post('/verify-pi-token', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'Missing accessToken' });
  }
  try {
    // Verify token with Pi Network mainnet API
    const response = await axios.get(
      `${BASE_URL}/v2/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    res.status(200).json({ success: true, user: response.data });
  } catch (error) {
    console.error('Error verifying Pi token:', error.response?.data || error.message);
    res.status(401).json({ success: false, error: error.response?.data || error.message });
  }
});
    const response = await axios.get(
      `${BASE_URL}/v2/ads_network/status/${adId}`,
      {
        headers: {
          Authorization: `key ${API_KEY}`,
        },
      }
    );
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error verifying rewarded ad:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// Endpoint to handle server-side approval
app.post('/approve-payment', async (req, res) => {
  const { paymentId } = req.body;
  return res.status(403).json({ error: 'Mock/test payments are disabled.' });
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});


// Endpoint to handle server-side completion
app.post('/complete-payment', async (req, res) => {
  const { paymentId, txid } = req.body;
  return res.status(403).json({ error: 'Mock/test payments are disabled.' });
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});