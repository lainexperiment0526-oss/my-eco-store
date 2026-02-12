// Verify Payment Edge Function - MAINNET
// This function verifies payment status with Pi Network
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
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    // Parse request
    const { paymentId } = req.method === 'POST' ? await req.json() : { paymentId: new URL(req.url).searchParams.get('paymentId') };

    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    // Get payment status from Pi Network API
    const piResponse = await fetch(`${PI_API_BASE_URL}/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      throw new Error(`Pi API error: ${piResponse.status} - ${errorText}`);
    }

    const paymentStatus = await piResponse.json();

    // Update local payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus.status,
        pi_response: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId);

    if (updateError) {
      console.error('Failed to update payment record:', updateError);
    }

    // Log verification
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        payment_id: paymentId,
        action: 'verify',
        status: 'success',
        response: paymentStatus,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log payment verification:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        status: paymentStatus.status,
        payment: paymentStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payment verification error:', errorMessage);
    
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