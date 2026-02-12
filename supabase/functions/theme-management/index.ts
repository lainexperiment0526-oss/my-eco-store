// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore: Deno global is available at runtime in Supabase Edge Functions
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper to get Supabase client with user's JWT
function getUserSupabaseClient(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  const jwt = authHeader.replace('Bearer ', '');
  return createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // GET: Fetch theme templates
    if (req.method === 'GET') {
      if (action === 'templates') {
        const category = url.searchParams.get('category');
        const popular = url.searchParams.get('popular');
        
        let query = serviceSupabase
          .from('theme_templates')
          .select('*')
          .order('usage_count', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        if (popular === 'true') {
          query = query.eq('is_popular', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'presets') {
        const category = url.searchParams.get('category');
        
        let query = serviceSupabase
          .from('advanced_customization_presets')
          .select('*')
          .order('usage_count', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Invalid action for GET request');
    }

    // POST: Apply theme or preset
    if (req.method === 'POST') {
      const body = await req.json();

      const { profileId, themeId, presetName, username, userId } = body;


      if (!profileId) {
        throw new Error('Missing profileId');
      }
      if (!userId) {
        throw new Error('Missing userId');
      }

      if (action === 'apply-theme' && themeId) {
        // Apply theme template using the database function
        const { data, error } = await serviceSupabase
          .rpc('apply_theme_template', {
            p_profile_id: profileId,
            p_theme_id: themeId
          });

        if (error) throw error;

        console.log(`✅ Applied theme ${themeId} to profile ${profileId} (username: ${username})`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            applied: data,
            themeId,
            message: 'Theme applied successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }


      if (action === 'apply-preset' && presetName) {
        // Get preset settings
        const { data: preset, error: presetError } = await serviceSupabase
          .from('advanced_customization_presets')
          .select('settings, usage_count')
          .eq('preset_name', presetName)
          .single();

        if (presetError) throw presetError;

        // Use user's auth context for upsert (RLS compliance)
        const userSupabase = getUserSupabaseClient(req);
        const { data, error } = await userSupabase
          .from('user_preferences')
          .upsert({
            profile_id: profileId,
            user_id: userId,
            advanced_settings: preset.settings,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'profile_id'
          })
          .select()
          .single();

        if (error) throw error;

        // Increment preset usage count (service key OK)
        await serviceSupabase
          .from('advanced_customization_presets')
          .update({ usage_count: (preset.usage_count || 0) + 1 })
          .eq('preset_name', presetName);

        console.log(`✅ Applied preset ${presetName} to profile ${profileId} (username: ${username})`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            data,
            presetName,
            settings: preset.settings,
            message: 'Preset applied successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Invalid action for POST request');
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error("Theme management error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
