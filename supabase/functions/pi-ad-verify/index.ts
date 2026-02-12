// Deno type declarations for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify Pi Network token
    const piApiKey = Deno.env.get('VITE_PI_API_KEY') || Deno.env.get('PI_API_KEY');
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (piApiKey) {
      headers['X-Api-Key'] = piApiKey;
    }
    
    const piResponse = await fetch('https://api.minepi.com/v2/me', {
      headers
    });

    if (!piResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid Pi Network token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { adId } = await req.json();
    
    if (!adId) {
      return new Response(
        JSON.stringify({ error: 'Missing adId parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify Pi API key is available for ad verification
    const adApiKey = Deno.env.get('PI_API_KEY') || piApiKey;
    if (!adApiKey) {
      console.error('PI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Pi API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify ad status with Pi Platform API
    const adVerifyResponse = await fetch(`https://api.minepi.com/v2/ads_network/status/${adId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${adApiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!adVerifyResponse.ok) {
      const errorText = await adVerifyResponse.text();
      console.error('Pi Platform API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify ad with Pi Platform API',
          details: errorText 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const adData = await adVerifyResponse.json();
    
    // Check if ad was properly granted
    if (adData.mediator_ack_status === 'granted') {
      // Reward user - increment wallet or give credits
      const piUser = await piResponse.json();
      
      // Add reward to user's wallet
      const { error: walletError } = await supabase.functions.invoke('wallet-increment', {
        body: {
          user_id: piUser.uid,
          amount: 1, // 1 Pi reward for watching ad
          reason: 'ad_reward',
          ad_id: adId
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (walletError) {
        console.error('Failed to increment wallet:', walletError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          reward_granted: true,
          mediator_ack_status: adData.mediator_ack_status,
          reward_amount: 1
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reward_granted: false,
        mediator_ack_status: adData.mediator_ack_status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Pi Ad verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});