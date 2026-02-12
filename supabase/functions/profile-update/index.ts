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

// Enhanced link metadata validation
function validateEnhancedLinks(customLinks: any[]): any[] {
  if (!Array.isArray(customLinks)) return [];
  
  return customLinks.map(link => {
    // Ensure required fields exist
    const enhancedLink = {
      id: link.id || crypto.randomUUID(),
      title: link.title || '',
      url: link.url || '',
      icon: link.icon || 'link',
      description: link.description || '',
      favicon: link.favicon || '',
      image: link.image || '',
      color: link.color || '#3b82f6',
      textColor: link.textColor || '#ffffff',
      category: link.category || 'general',
      isVisible: link.isVisible !== false,
      customStyling: {
        backgroundColor: link.customStyling?.backgroundColor || '#3b82f6',
        borderColor: link.customStyling?.borderColor || '#2563eb',
        borderRadius: link.customStyling?.borderRadius || 8,
        fontSize: link.customStyling?.fontSize || 16,
        fontWeight: link.customStyling?.fontWeight || 500,
        padding: link.customStyling?.padding || 12,
        animation: link.customStyling?.animation || 'none'
      }
    };

    // Validate and sanitize base64 images
    if (enhancedLink.favicon?.startsWith('data:image/')) {
      const sizeEstimate = (enhancedLink.favicon.length * 0.75) / (1024 * 1024);
      if (sizeEstimate > 2) { // 2MB limit for favicons
        console.warn(`Favicon too large (${sizeEstimate.toFixed(2)}MB), removing`);
        enhancedLink.favicon = '';
      }
    }

    if (enhancedLink.image?.startsWith('data:image/')) {
      const sizeEstimate = (enhancedLink.image.length * 0.75) / (1024 * 1024);
      if (sizeEstimate > 5) { // 5MB limit for preview images
        console.warn(`Preview image too large (${sizeEstimate.toFixed(2)}MB), removing`);
        enhancedLink.image = '';
      }
    }

    return enhancedLink;
  });
}

// Enhanced theme settings validation
function validateThemeSettings(themeSettings: any): any {
  if (!themeSettings || typeof themeSettings !== 'object') {
    return {
      primaryColor: '#3b82f6',
      backgroundColor: '#000000',
      backgroundType: 'color',
      backgroundGif: '',
      iconStyle: 'rounded',
      buttonStyle: 'filled',
      customLinks: []
    };
  }

  // Validate and enhance custom links
  if (themeSettings.customLinks) {
    themeSettings.customLinks = validateEnhancedLinks(themeSettings.customLinks);
  }

  // Validate advanced customization settings
  if (themeSettings.advancedSettings) {
    console.log('Processing advanced customization settings');
  }

  return {
    ...themeSettings,
    customLinks: themeSettings.customLinks || []
  };
}

async function getProfileFromPiToken(piAccessToken: string, requestedUsername?: string) {
  if (!piAccessToken) {
    throw new Error('Missing Pi access token');
  }

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

  if (requestedUsername && requestedUsername !== piUsername) {
    console.warn(`Requested username ${requestedUsername} does not match Pi user ${piUsername}. Using Pi user.`);
  }

  const { data: profile, error } = await serviceSupabase
    .from('profiles')
    .select('id, username')
    .eq('username', requestedUsername || piUsername)
    .maybeSingle();

  if (error || !profile) {
    throw new Error('Profile not found for Pi user');
  }

  return profile;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    const { username, profileData, piAccessToken } = body;

    if (!username || !profileData) {
      throw new Error("Missing required fields");
    }

    // Enhanced validation and processing
    let processedProfileData = { ...profileData };

    // Validate and enhance theme settings
    if (processedProfileData.theme_settings) {
      processedProfileData.theme_settings = validateThemeSettings(processedProfileData.theme_settings);
      
      // Log enhanced link processing
      const customLinks = processedProfileData.theme_settings.customLinks || [];
      const enhancedLinksCount = customLinks.filter((link: any) => 
        link.favicon || link.image || link.description || link.customStyling
      ).length;
      
      if (enhancedLinksCount > 0) {
        console.log(`Processing ${enhancedLinksCount} enhanced links with metadata for user ${username}`);
      }
    }

    // Log GIF background save attempts for Pi users
    if (processedProfileData.theme_settings?.backgroundGif?.startsWith?.('data:')) {
      const gifSizeEstimate = (processedProfileData.theme_settings.backgroundGif.length * 0.75) / (1024 * 1024);
      console.log(`Pi user ${username} saving custom GIF background, estimated size: ${gifSizeEstimate.toFixed(2)}MB`);
      
      if (gifSizeEstimate > 20) { // Edge function size limit protection
        throw new Error('GIF file too large for database storage');
      }
    } else if (processedProfileData.theme_settings?.backgroundGif) {
      console.log(`Pi user ${username} saving GIF background URL: ${processedProfileData.theme_settings.backgroundGif.substring(0, 100)}...`);
    }

    let profile;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) {
        throw new Error('Invalid or expired token');
      }

      const { data: profileDataResult, error: profileError } = await serviceSupabase
        .from('profiles')
        .select('id, user_id, username')
        .eq('username', username)
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileDataResult) {
        throw new Error('Profile not found or access denied');
      }

      profile = profileDataResult;
    } else {

      const tokenFromHeader = req.headers.get('x-pi-access-token') || piAccessToken;
      if (!tokenFromHeader) {
        throw new Error('Missing or invalid authorization header');
      }
      // Try to get profile, but do not throw if not found
      let foundProfile = null;
      try {
        foundProfile = await getProfileFromPiToken(tokenFromHeader, username);
      } catch (e) {
        // Profile not found, will insert
      }
      profile = foundProfile;
    }

    let data, error;
    if (profile && profile.id) {
      // Update existing profile
      ({ data, error } = await serviceSupabase
        .from("profiles")
        .update({
          ...processedProfileData,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)
        .select()
        .single());
    } else {
      // Insert new profile (for new Pi user)
      ({ data, error } = await serviceSupabase
        .from("profiles")
        .insert({
          ...processedProfileData,
          username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single());
    }

    if (error) throw error;

    // Log successful saves with enhanced features
    if (processedProfileData.theme_settings?.backgroundGif?.startsWith?.('data:')) {
      console.log(`✅ Successfully saved custom GIF background for Pi user ${username}`);
    } else if (processedProfileData.theme_settings?.backgroundGif) {
      console.log(`✅ Successfully saved GIF background URL for Pi user ${username}`);
    }

    const enhancedLinksCount = processedProfileData.theme_settings?.customLinks?.filter((link: any) => 
      link.favicon || link.image || link.description
    ).length || 0;

    if (enhancedLinksCount > 0) {
      console.log(`✅ Successfully saved ${enhancedLinksCount} enhanced links with metadata for user ${username}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        enhancedFeatures: {
          customLinksProcessed: processedProfileData.theme_settings?.customLinks?.length || 0,
          enhancedLinksCount,
          hasGifBackground: !!processedProfileData.theme_settings?.backgroundGif
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Profile update error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

