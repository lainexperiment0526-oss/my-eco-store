// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { profileId, amount, reason } = body;
    
    if (!profileId || !amount || amount <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request: profileId and positive amount required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('drop_tokens')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (walletError) {
      throw new Error(`Failed to get wallet: ${walletError.message}`);
    }

    const currentBalance = wallet?.drop_tokens || 0;
    const newBalance = currentBalance + amount;

    // Update or insert wallet balance
    const { error: updateError } = await supabase
      .from('user_wallets')
      .upsert({
        profile_id: profileId,
        drop_tokens: newBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id' });

    if (updateError) {
      throw new Error(`Failed to update wallet: ${updateError.message}`);
    }

    console.log(`Wallet incremented: ${profileId} +${amount} (${reason || 'no reason'})`);

    return new Response(JSON.stringify({ 
      success: true,
      new_balance: newBalance,
      message: 'Wallet balance incremented successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

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
