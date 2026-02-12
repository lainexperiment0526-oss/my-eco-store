import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    console.log('[DROPPAY_CREATE] Request body:', JSON.stringify(req.body, null, 2));
    
    // Read DropPay configuration from server-side env
    // Fallback to VITE_* variants if present to ease migration
    const baseUrl =
      process.env.DROPPAY_BASE_URL ||
      process.env.VITE_DROPPAY_BASE_URL ||
      'https://droppay.space/api/v1';
    const apiKey = process.env.DROPPAY_API_KEY || process.env.VITE_DROPPAY_API_KEY;
    const authScheme = process.env.DROPPAY_AUTH_SCHEME || process.env.VITE_DROPPAY_AUTH_SCHEME || 'Key';

    console.log('[DROPPAY_CREATE] Config:', { baseUrl, hasApiKey: !!apiKey, authScheme });

    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error: DROPPAY_API_KEY missing',
      });
    }

    const { amount, currency, description, metadata } = req.body || {};
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const paymentData = { amount, currency: currency || 'PI', description, metadata };
    console.log('[DROPPAY_CREATE] Creating payment:', paymentData);

    const r = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `${authScheme} ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    const text = await r.text();
    console.log('[DROPPAY_CREATE] Response status:', r.status);
    console.log('[DROPPAY_CREATE] Response text:', text);
    
    if (!r.ok) {
      console.error('[DROPPAY_CREATE] API error:', text);
      // More detailed error response with actual HTTP status
      return res.status(r.status).json({ 
        success: false,
        error: `Droppay API error (${r.status}): ${text.substring(0, 200)}`,
        status: r.status 
      });
    }
    
    let data: any;
    try {
      data = JSON.parse(text);
      console.log('[DROPPAY_CREATE] Parsed response:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('[DROPPAY_CREATE] Failed to parse response:', err);
      data = { ok: true, raw: text };
    }
    
    // Normalize checkout URL for client
    const checkoutUrl =
      data?.checkout_url ||
      data?.url ||
      data?.payment_url ||
      data?.payment?.checkout_url ||
      data?.links?.checkout ||
      data?.redirect_url ||
      data?.checkoutUrl ||
      data?.payment?.url ||
      data?.payment?.payment_url ||
      undefined;

    console.log('[DROPPAY_CREATE] Extracted checkout URL:', checkoutUrl);

    // Ensure the payment object contains a standard field
    const payment = { ...data };
    if (checkoutUrl && !payment.checkout_url) {
      payment.checkout_url = checkoutUrl;
    }

    // If still no checkout URL, log the entire response structure
    if (!checkoutUrl) {
      console.error('[DROPPAY_CREATE] No checkout URL found in response. Full response:', JSON.stringify(data, null, 2));
      console.error('[DROPPAY_CREATE] Response keys:', Object.keys(data));
      if (data.payment) {
        console.error('[DROPPAY_CREATE] Payment object keys:', Object.keys(data.payment));
      }
      
      // Return error if no checkout URL found
      return res.status(400).json({ 
        success: false, 
        error: 'DropPay API did not return a checkout URL. This may indicate the DropPay service is unavailable or the API format has changed.',
        payment: data,
        debug: {
          responseKeys: Object.keys(data),
          paymentKeys: data.payment ? Object.keys(data.payment) : null
        }
      });
    }

    console.log('[DROPPAY_CREATE] Successfully created payment with checkout URL');
    return res.status(200).json({ success: true, payment });
  } catch (e: any) {
    const msg = e?.message || 'Unknown error';
    return res.status(400).json({ error: msg });
  }
}
