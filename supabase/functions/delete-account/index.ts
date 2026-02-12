// Delete Account Edge Function
// This function handles account deletion requests
// @ts-ignore: Deno global is available at runtime in Supabase Edge Functions
declare const Deno: any;
// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { userId, confirmDelete } = await req.json();

    if (!userId || !confirmDelete) {
      throw new Error('User ID and delete confirmation are required');
    }

    // Get user data before deletion for backup
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      throw new Error('User not found');
    }

    // Create deletion record for audit trail
    const { error: auditError } = await supabase
      .from('account_deletions')
      .insert({
        user_id: userId,
        username: userData.username,
        deleted_at: new Date().toISOString(),
        user_data_backup: userData
      });

    if (auditError) {
      console.error('Failed to create audit record:', auditError);
    }

    // Delete user-related data in correct order (foreign key constraints)
    const deleteOperations = [
      { table: 'payment_logs', column: 'user_id' },
      { table: 'ad_rewards', column: 'user_id' },
      { table: 'user_balances', column: 'user_id' },
      { table: 'payments', column: 'user_id' },
      { table: 'subscriptions', column: 'user_id' },
      { table: 'followers', column: 'follower_id' },
      { table: 'followers', column: 'following_id' },
      { table: 'products', column: 'user_id' },
      { table: 'stores', column: 'user_id' },
      { table: 'profiles', column: 'id' }
    ];

    for (const operation of deleteOperations) {
      const { error } = await supabase
        .from(operation.table)
        .delete()
        .eq(operation.column, userId);

      if (error) {
        console.error(`Failed to delete from ${operation.table}:`, error);
      }
    }

    // Delete auth user (this should be last)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Failed to delete auth user:', authError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
        userId,
        deletedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Account deletion error:', errorMessage);
    
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