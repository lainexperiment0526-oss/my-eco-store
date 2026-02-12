// Supabase Edge Function: Followers Management (follow, unfollow, get followers/following)
// Endpoint: /followers
// Methods: POST (follow), DELETE (unfollow), GET (get followers/following)
// Requires: Pi Auth (username/uid)

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
  const userId = user.id;

  if (req.method === 'POST') {
    // Follow user
    const body = await req.json();
    const { target_user_id } = body;
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'Missing target_user_id' }), { status: 400, headers: corsHeaders });
    }
    if (target_user_id === userId) {
      return new Response(JSON.stringify({ error: 'Cannot follow yourself' }), { status: 400, headers: corsHeaders });
    }
    const { data, error } = await supabase
      .from('followers')
      .insert([{ following_profile_id: target_user_id, follower_profile_id: userId }])
      .select()
      .maybeSingle();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
    return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders });
  }

  if (req.method === 'DELETE') {
    // Unfollow user
    const url = new URL(req.url);
    const target_user_id = url.searchParams.get('target_user_id');
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'Missing target_user_id' }), { status: 400, headers: corsHeaders });
    }
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('following_profile_id', target_user_id)
      .eq('follower_profile_id', userId);
    if (error) {
      return new Response(JSON.stringify({ error: 'Unfollow failed' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    // Get followers or following
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'followers' or 'following'
    const id = url.searchParams.get('id'); // user id
    if (!type || !id) {
      return new Response(JSON.stringify({ error: 'Missing type or id' }), { status: 400, headers: corsHeaders });
    }
    if (type === 'followers') {
      // Get followers of user
      const { data, error } = await supabase
        .from('followers')
        .select('follower_profile_id')
        .eq('following_profile_id', id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
    } else if (type === 'following') {
      // Get users this user is following
      const { data, error } = await supabase
        .from('followers')
        .select('following_profile_id')
        .eq('follower_profile_id', id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
});
