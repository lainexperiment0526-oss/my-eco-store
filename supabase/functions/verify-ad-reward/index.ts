// Verify Ad Reward Edge Function - MAINNET
// This function verifies ad rewards from Pi Ad Network
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
    const { adId, userId, rewardAmount, verificationData } = await req.json();

    if (!adId || !userId) {
      throw new Error('Ad ID and User ID are required');
    }

    // Verify ad reward with Pi Ad Network API
    const piResponse = await fetch(`${PI_API_BASE_URL}/v2/ads_network/rewards/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ad_id: adId,
        user_id: userId,
        reward_amount: rewardAmount,
        verification_data: verificationData
      }),
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      throw new Error(`Pi API error: ${piResponse.status} - ${errorText}`);
    }

    const verificationResult = await piResponse.json();

    if (verificationResult.verified) {
      // Record verified ad reward
      const { error: insertError } = await supabase
        .from('ad_rewards')
        .insert({
          ad_id: adId,
          user_id: userId,
          reward_amount: rewardAmount,
          status: 'verified',
          pi_response: verificationResult,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to record ad reward:', insertError);
      }

      // Update user's reward balance
      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert({
          user_id: userId,
          ad_rewards: rewardAmount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (balanceError) {
        console.error('Failed to update user balance:', balanceError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: verificationResult.verified,
        adId,
        userId,
        rewardAmount,
        result: verificationResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Ad reward verification error:', errorMessage);
    
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