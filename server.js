import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { secureLog, logApiStatus } from './utils/secureLogging.js';
import { generateProfileMetadata } from './server/metadataGenerator.js';
import { createMetadataHtmlPage, createNotFoundHtmlPage } from './server/htmlTemplate.js';

dotenv.config();

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Droppay: create payment
app.post('/droppay/create', async (req, res) => {
  try {
    const baseUrl = process.env.DROPPAY_BASE_URL || 'https://droppay.space/api/v1';
    const apiKey = process.env.DROPPAY_API_KEY;
    const authScheme = process.env.DROPPAY_AUTH_SCHEME || 'Key';

    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: DROPPAY_API_KEY missing' });
    }

    const { amount, currency, description, metadata } = req.body || {};
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const r = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `${authScheme} ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency: currency || 'PI', description, metadata }),
    });
    const text = await r.text();
    if (!r.ok) {
      return res.status(400).json({ error: `Droppay create failed: ${text}` });
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: true, raw: text };
    }
    return res.json({ success: true, payment: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return res.status(400).json({ error: msg });
  }
});

// Droppay: webhook handler
app.post('/droppay/webhook', async (req, res) => {
  try {
    const secret = process.env.DROPPAY_WEBHOOK_SECRET;
    const sigHeader = req.header('X-Droppay-Signature') || req.header('x-droppay-signature');
    const payload = req.body;

    if (secret && sigHeader) {
      const h = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      if (h !== sigHeader) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase environment variables missing' });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const status = payload?.status || payload?.payment?.status;
    const metadata = payload?.metadata || payload?.payment?.metadata || {};
    const profileId = metadata.profile_id || metadata.profileId;
    const plan = metadata.plan;
    const period = metadata.period || 'monthly';
    const amount = payload?.amount || payload?.payment?.amount || 0;
    const paymentId = payload?.id || payload?.payment?.id;
    const txid = payload?.txid || payload?.transaction_id || paymentId;

    if (status === 'completed' && profileId && plan) {
      const now = new Date();
      const expiresAt = new Date(now);
      if (period === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { error: updErr } = await supabase
        .from('profiles')
        .update({
          subscription_plan: plan,
          subscription_expires_at: expiresAt.toISOString(),
          subscription_period: period,
          has_premium: plan !== 'free',
        })
        .eq('id', profileId);

      if (updErr) {
        return res.status(500).json({ error: updErr.message || updErr });
      }

      await supabase
        .from('subscription_transactions')
        .insert({
          profile_id: profileId,
          plan,
          period,
          pi_amount: amount || 0,
          payment_id: paymentId,
          txid,
          expires_at: expiresAt.toISOString(),
        });
    }

    // Record product purchase if present
    const productId = metadata.product_id || metadata.productId;
    if (status === 'completed' && profileId && productId) {
      await supabase
        .from('payment_transactions')
        .insert({
          profile_id: profileId,
          transaction_id: txid || `dp_${paymentId || Date.now()}`,
          payment_id: paymentId,
          amount: amount || 0,
          sender_address: payload?.sender || '',
          receiver_address: payload?.receiver || '',
          status: 'completed',
          memo: metadata.description || '',
          pi_metadata: metadata,
          confirmed_at: new Date().toISOString(),
        });
    }

    return res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return res.status(400).json({ error: msg });
  }
});

// /pi-payment-approve route
app.post('/pi-payment-approve', async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }
    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      secureLog.error('PI_API_KEY not configured (missing in environment)');
      return res.status(500).json({ error: 'Server configuration error: PI_API_KEY missing' });
    } else {
      logApiStatus('Pi Network', piApiKey);
    }
    const approveResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const responseText = await approveResponse.text();
    if (!approveResponse.ok) {
      return res.status(400).json({ error: `Failed to approve payment: ${responseText}` });
    }
    let approvalData;
    try {
      approvalData = JSON.parse(responseText);
    } catch {
      approvalData = { status: 'approved', paymentId };
    }
    return res.json({ success: true, payment: approvalData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(400).json({ error: errorMessage });
  }
});

// /pi-payment-complete route
app.post('/pi-payment-complete', async (req, res) => {
  try {
    const { paymentId, txid, metadata, profileId: bodyProfileId, plan: bodyPlan, period: bodyPeriod } = req.body;
    if (!paymentId || !txid) {
      return res.status(400).json({ error: 'Payment ID and transaction ID are required' });
    }

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      console.error('PI_API_KEY not configured (missing in environment)');
      return res.status(500).json({ error: 'Server configuration error: PI_API_KEY missing' });
    }

    const completeResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    const responseText = await completeResponse.text();
    if (!completeResponse.ok) {
      return res.status(400).json({ error: `Failed to complete payment: ${responseText}` });
    }

    let paymentData;
    try {
      paymentData = JSON.parse(responseText);
    } catch {
      paymentData = { status: 'completed', paymentId, txid };
    }

    // Update subscription in Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase environment variables missing' });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const meta = metadata || paymentData?.metadata || {};
    const profileId = bodyProfileId || meta.profile_id || meta.profileId;
    const plan = bodyPlan || meta.plan;
    const period = bodyPeriod || meta.period || 'monthly';
    const piAmount = paymentData?.amount || meta.amount || 0;

    if (profileId && plan) {
      const now = new Date();
      const expiresAt = new Date(now);
      if (period === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: plan,
          subscription_expires_at: expiresAt.toISOString(),
          subscription_period: period,
          has_premium: plan !== 'free',
        })
        .eq('id', profileId);

      if (updateError) {
        return res.status(500).json({ error: updateError.message || updateError });
      }

      await supabase
        .from('subscription_transactions')
        .insert({
          profile_id: profileId,
          plan,
          period,
          pi_amount: piAmount,
          payment_id: paymentId,
          txid,
          expires_at: expiresAt.toISOString(),
        });
    }

    return res.json({ success: true, payment: paymentData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(400).json({ error: errorMessage });
  }
});

// /pi-auth route
app.post('/pi-auth', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      return res.status(500).json({ error: 'Server configuration error: PI_API_KEY missing' });
    }
    const verifyResponse = await fetch('https://api.minepi.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      return res.status(400).json({ error: `Pi verification failed: ${verifyResponse.status}` });
    }
    const piUser = await verifyResponse.json();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase environment variables missing' });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // ... (rest of your Supabase logic here)
    return res.json({ success: true, user: piUser });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(400).json({ error: errorMessage });
  }
});

/**
 * Dynamic metadata route for user profiles
 * Handles: GET /@:username
 * Returns HTML with injected Open Graph and Twitter metadata
 * This allows social media crawlers to show proper previews
 */
app.get('/@:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    // Validate username format (alphanumeric, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).send(createNotFoundHtmlPage(username));
    }
    
    // Generate metadata from user profile
    const metadata = await generateProfileMetadata(username);
    
    if (metadata.notFound) {
      // Return 404 response for social crawlers while still providing metadata
      res.status(404);
    }
    
    // Generate and return HTML with metadata
    const html = createMetadataHtmlPage(metadata);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Metadata route error:', errorMessage);
    // Return a safe HTML page even on error
    const username = req.params.username || 'unknown';
    res.status(500).send(createNotFoundHtmlPage(username));
  }
});

/**
 * API endpoint for fetching profile metadata (for debugging/testing)
 * Handles: GET /api/metadata/:username
 */
app.get('/api/metadata/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }
    
    const metadata = await generateProfileMetadata(username);
    res.json(metadata);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Metadata API error:', errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
