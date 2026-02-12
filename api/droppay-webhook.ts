import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    console.log('[DROPPAY_WEBHOOK] Received webhook:', JSON.stringify(req.body, null, 2));
    
    const secret = process.env.DROPPAY_WEBHOOK_SECRET;
    const sigHeader = (req.headers['x-droppay-signature'] || req.headers['X-Droppay-Signature']) as string | undefined;
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

    console.log('[DROPPAY_WEBHOOK] Parsed data:', {
      status,
      profileId,
      plan,
      period,
      amount,
      paymentId,
      txid
    });

    // Grant subscription on completion
    if (status === 'completed' && profileId && plan) {
      console.log('[DROPPAY_WEBHOOK] Creating subscription for profile:', profileId);
      const now = new Date();
      const startDate = now.toISOString();
      const expiresAt = new Date(now);
      if (period === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      const endDate = expiresAt.toISOString();

      // Create/update subscription in subscriptions table
      const subscriptionData = {
        profile_id: profileId,
        plan_type: plan,
        billing_period: period,
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        pi_amount: amount || 0,
        pi_transaction_id: txid || paymentId,
      };
      
      console.log('[DROPPAY_WEBHOOK] Upserting subscription:', subscriptionData);
      
      const { error: subErr } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'profile_id'
        });

      if (subErr) {
        console.error('[DROPPAY_WEBHOOK] Failed to create subscription:', subErr);
        return res.status(500).json({ error: subErr.message || subErr });
      }
      
      console.log('[DROPPAY_WEBHOOK] Subscription created successfully');

      // Also record in subscription_transactions for history
      await supabase
        .from('subscription_transactions')
        .insert({
          profile_id: profileId,
          plan,
          period,
          pi_amount: amount || 0,
          payment_id: paymentId,
          txid,
          expires_at: endDate,
        });
      
      console.log('[DROPPAY_WEBHOOK] Transaction recorded successfully');
    }

    // Record product purchase if present
    const productId = metadata.product_id || metadata.productId;
    if (status === 'completed' && profileId && productId) {
      console.log('[DROPPAY_WEBHOOK] Recording product purchase:', productId);
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
      console.log('[DROPPAY_WEBHOOK] Product purchase recorded');
    }

    console.log('[DROPPAY_WEBHOOK] Webhook processed successfully');
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'Unknown error';
    console.error('[DROPPAY_WEBHOOK] Error processing webhook:', msg, e);
    return res.status(400).json({ error: msg });
  }
}
