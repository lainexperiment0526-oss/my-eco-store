// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAuthorizedProfile(req: Request, body?: any) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, username')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  const piAccessToken = req.headers.get('x-pi-access-token') || body?.piAccessToken;
  if (piAccessToken) {
    const piResponse = await fetch('https://api.mainnet.minepi.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${piAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!piResponse.ok) {
      throw new Error('Failed to validate Pi access token');
    }

    const piData = await piResponse.json();
    const piUsername = piData?.username;

    if (!piUsername) {
      throw new Error('Pi user data missing username');
    }

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, username')
      .eq('username', piUsername)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Profile not found for Pi user');
    }

    return profile;
  }

  throw new Error('Missing or invalid authorization header');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const method = req.method;
    
    if (method === 'GET') {
      const profile = await getAuthorizedProfile(req);
      // Read financial data
      const { data: financialData, error } = await serviceSupabase
        .from('profile_financial_data')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch financial data: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true,
        data: financialData || {
          profile_id: profile.id,
          pi_wallet_address: null,
          pi_donation_message: 'Send me a coffee ☕',
          crypto_wallets: {},
          bank_details: {}
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else if (method === 'PUT' || method === 'POST') {
      // Update financial data
      const body = await req.json();
      const profile = await getAuthorizedProfile(req, body);
      
      const { data: financialData, error } = await serviceSupabase
        .from('profile_financial_data')
        .upsert({
          profile_id: profile.id,
          pi_wallet_address: body.pi_wallet_address || null,
          pi_donation_message: body.pi_donation_message || 'Send me a coffee ☕',
          crypto_wallets: body.crypto_wallets || {},
          bank_details: body.bank_details || {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update financial data: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true,
        data: financialData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      throw new Error('Method not allowed');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

