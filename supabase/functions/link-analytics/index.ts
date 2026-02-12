// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      profileId, 
      linkId, 
      linkTitle, 
      linkUrl, 
      userAgent, 
      ipAddress,
      sessionId
    } = body;

    if (!profileId || !linkId) {
      throw new Error("Missing required fields: profileId and linkId");
    }

    // Track the link click
    const { data, error } = await serviceSupabase
      .from('analytics')
      .insert({
        profile_id: profileId,
        event_type: 'link_click',
        event_data: {
          link_id: linkId,
          link_title: linkTitle || '',
          link_url: linkUrl || '',
          timestamp: new Date().toISOString(),
          user_agent: userAgent || '',
          session_id: sessionId || ''
        },
        user_agent: userAgent || '',
        ip_address: ipAddress || null,
        session_id: sessionId || '',
        link_id: linkId,
        link_metadata: {
          title: linkTitle || '',
          url: linkUrl || '',
          clicked_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking link click:', error);
      throw error;
    }

    console.log(`✅ Tracked link click: ${linkTitle} (${linkId}) for profile ${profileId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          analyticsId: data.id,
          tracked: true,
          linkId,
          timestamp: data.created_at
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Link analytics error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        tracked: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});