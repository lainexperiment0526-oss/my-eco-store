// Supabase Edge Function: Subscription Management
// Endpoint: /subscription
// Methods: POST (create/upgrade), GET (get by user), PUT (update), DELETE (cancel)

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

  // Get Supabase env
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not set' }), { status: 500, headers: corsHeaders });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse auth header for Pi username/uid
  const piUsername = req.headers.get('x-pi-username');
  const piUid = req.headers.get('x-pi-uid');
  if (!piUsername || !piUid) {
    return new Response(JSON.stringify({ error: 'Missing Pi Auth headers' }), { status: 401, headers: corsHeaders });
  }

  // Get user id from profiles table
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', piUsername)
    .maybeSingle();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
  }
  const profileId = user.id;

  if (req.method === 'POST') {
    // Create or upgrade subscription
    const body = await req.json();
    const { plan_type, billing_period, pi_amount } = body;
    if (!plan_type || !billing_period) {
      return new Response(JSON.stringify({ error: 'Missing plan_type or billing_period' }), { status: 400, headers: corsHeaders });
    }
    
    // Calculate end date based on billing period
    const endDate = new Date();
    if (billing_period === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // Upsert subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        profile_id: profileId,
        plan_type,
        billing_period,
        pi_amount: pi_amount || 0,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        auto_renew: true
      }, { onConflict: 'profile_id' })
      .select()
      .maybeSingle();
      
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
    return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    // Get subscription by profile
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
    if (!data) {
      return new Response(JSON.stringify({ subscription: null }), { status: 200, headers: corsHeaders });
    }
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  }

  if (req.method === 'PUT') {
    // Update subscription
    const body = await req.json();
    const { plan_type, billing_period, status, auto_renew } = body;
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan_type, billing_period, status, auto_renew })
      .eq('profile_id', profileId)
      .select()
      .maybeSingle();
      
    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Update failed' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  }

  if (req.method === 'DELETE') {
    // Cancel subscription (set status to cancelled)
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', auto_renew: false })
      .eq('profile_id', profileId);
      
    if (error) {
      return new Response(JSON.stringify({ error: 'Cancel failed' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
});
