// Supabase Edge Function: Product Management (create, get, update, delete, list by store)
// Endpoint: /product
// Methods: POST (create), GET (get by id or list by store), PUT (update), DELETE (delete)
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

  // Route by method
  if (req.method === 'POST') {
    // Create product
    const body = await req.json();
    const { title, price, description, image, file_url } = body;
    if (!title || price == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([{ profile_id: userId, title, price: String(price), description, image, file_url }])
      .select()
      .maybeSingle();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
    return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    // Get product by id or list by profile
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const profileId = url.searchParams.get('profile_id');
    if (id) {
      // Get product by id
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: corsHeaders });
      }
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
    } else if (profileId) {
      // List products by profile
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('profile_id', profileId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ error: 'Missing id or profile_id' }), { status: 400, headers: corsHeaders });
    }
  }

  if (req.method === 'PUT') {
    // Update product
    const body = await req.json();
    const { id, title, price, description, image, file_url } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing product id' }), { status: 400, headers: corsHeaders });
    }
    // Check product ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, profile_id')
      .eq('id', id)
      .maybeSingle();
    if (productError || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: corsHeaders });
    }
    if (product.profile_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
    }
    
    const { data, error } = await supabase
      .from('products')
      .update({ title, price: String(price), description, image, file_url })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Update failed' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  }

  if (req.method === 'DELETE') {
    // Delete product
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing product id' }), { status: 400, headers: corsHeaders });
    }
    // Check product ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, profile_id')
      .eq('id', id)
      .maybeSingle();
    if (productError || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: corsHeaders });
    }
    if (product.profile_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) {
      return new Response(JSON.stringify({ error: 'Delete failed' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
});
