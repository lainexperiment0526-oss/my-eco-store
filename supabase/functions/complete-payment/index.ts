// Complete Payment Edge Function - MAINNET
// This function handles payment completion in the Pi Network payment flow
// @ts-ignore: Deno global is available at runtime in Supabase Edge Functions
declare const Deno: any;
// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Pi Network MAINNET API endpoint
const PI_API_BASE_URL = "https://api.minepi.com";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const PI_API_KEY = Deno.env.get('PI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { paymentId, txid } = await req.json();

    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    // Complete payment with Pi Network API
    const piResponse = await fetch(`${PI_API_BASE_URL}/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      throw new Error(`Pi API error: ${piResponse.status} - ${errorText}`);
    }

    const piResult = await piResponse.json();

    // Update payment record in database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        txid: txid,
        completed_at: new Date().toISOString(),
        pi_response: piResult
      })
      .eq('payment_id', paymentId);

    if (updateError) {
      console.error('Failed to update payment record:', updateError);
    }

    // Log payment completion
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        payment_id: paymentId,
        action: 'complete',
        status: 'success',
        response: piResult,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log payment completion:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        txid,
        result: piResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payment completion error:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});