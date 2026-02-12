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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // GET: Retrieve short links or redirect
    if (req.method === 'GET') {
      const shortCode = url.searchParams.get('code');
      const profileId = url.searchParams.get('profile_id');

      if (action === 'redirect' && shortCode) {
        // Track the click and get redirect URL
        const clickData = {
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent') || '',
          referrer: req.headers.get('referer') || '',
          session_id: url.searchParams.get('session_id') || ''
        };

        const { data: result } = await serviceSupabase
          .rpc('track_link_click', {
            p_short_code: shortCode,
            p_ip_address: clickData.ip_address,
            p_user_agent: clickData.user_agent,
            p_referrer: clickData.referrer,
            p_session_id: clickData.session_id
          });

        if (result?.success) {
          // Redirect to original URL
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': result.original_url
            }
          });
        } else {
          return new Response('Link not found or expired', { 
            status: 404,
            headers: corsHeaders 
          });
        }
      }

      if (action === 'list' && profileId) {
        // Get user's shortened links
        const { data: links, error } = await serviceSupabase
          .from('shortened_links')
          .select(`
            *,
            link_clicks!inner(count)
          `)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data: links }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'analytics' && profileId) {
        // Get analytics for user's links
        const days = parseInt(url.searchParams.get('days') || '30');
        
        const { data: analytics } = await serviceSupabase
          .rpc('get_link_analytics', {
            p_profile_id: profileId,
            p_days: days
          });

        return new Response(
          JSON.stringify({ success: true, data: analytics }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Invalid GET request parameters');
    }

    // POST: Create or update short links
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (action === 'create') {
        const {
          profileId,
          originalUrl,
          customAlias,
          title,
          description,
          thumbnail,
          displayStyle = 'classic',
          password,
          expiresAt,
          tags = []
        } = body;

        // Validate URL
        try {
          new URL(originalUrl);
        } catch {
          throw new Error('Invalid URL provided');
        }

        // Generate short code
        let shortCode;
        if (customAlias) {
          // Check if custom alias is available
          const { data: existing } = await serviceSupabase
            .from('shortened_links')
            .select('id')
            .eq('short_code', customAlias)
            .single();

          if (existing) {
            throw new Error('Custom alias is already taken');
          }
          shortCode = customAlias;
        } else {
          // Generate unique short code
          const { data: generatedCode } = await serviceSupabase
            .rpc('generate_short_code');
          shortCode = generatedCode;
        }

        const shortUrl = `https://drop.link/${shortCode}`;

        // Hash password if provided
        let passwordHash = null;
        if (password) {
          // In production, use proper password hashing
          passwordHash = btoa(password); // Simple base64 for demo
        }

        // Create shortened link
        const { data: newLink, error } = await serviceSupabase
          .from('shortened_links')
          .insert({
            profile_id: profileId,
            original_url: originalUrl,
            short_code: shortCode,
            short_url: shortUrl,
            custom_alias: customAlias,
            title: title || 'Untitled Link',
            description: description || '',
            thumbnail: thumbnail || '',
            display_style: displayStyle,
            password_hash: passwordHash,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            tags: tags,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        // Generate QR code
        const qrData = {
          shortened_link_id: newLink.id,
          profile_id: profileId,
          qr_data: shortUrl,
          size: 200,
          error_correction_level: 'M'
        };

        await serviceSupabase
          .from('qr_codes')
          .insert(qrData);

        console.log(`✅ Created short link: ${shortCode} -> ${originalUrl} (${title})`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: newLink,
            shortUrl,
            shortCode 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'update') {
        const { linkId, updates, profileId } = body;

        const { data: updatedLink, error } = await serviceSupabase
          .from('shortened_links')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', linkId)
          .eq('profile_id', profileId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data: updatedLink }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Invalid POST action');
    }

    // DELETE: Remove short links
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { linkId, profileId } = body;

      const { error } = await serviceSupabase
        .from('shortened_links')
        .update({ is_active: false })
        .eq('id', linkId)
        .eq('profile_id', profileId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Link deactivated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error("Link shortener error:", error);
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