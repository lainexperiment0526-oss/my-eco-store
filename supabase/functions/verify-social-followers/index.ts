// Verify Social Followers Edge Function
// This function fetches real follower counts from social media platforms
// deno-lint-ignore-file no-explicit-any
/// <reference lib="deno.window" />

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialLink {
  platform?: string;
  type?: string;
  url: string;
  followers?: number;
  verified_followers?: number;
  last_verified?: string;
  is_verified?: boolean;
}

// Extract username from social media URL
function extractUsername(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        const twitterMatch = pathname.match(/^\/(@?[\w]+)/);
        return twitterMatch ? twitterMatch[1].replace('@', '') : null;
        
      case 'instagram':
        const instaMatch = pathname.match(/^\/(@?[\w.]+)/);
        return instaMatch ? instaMatch[1].replace('@', '') : null;
        
      case 'youtube':
        const ytMatch = pathname.match(/^\/@?([\w-]+)|^\/c\/([\w-]+)/);
        return ytMatch ? (ytMatch[1] || ytMatch[2]) : null;
        
      case 'tiktok':
        const ttMatch = pathname.match(/^\/@([\w.]+)/);
        return ttMatch ? ttMatch[1] : null;
        
      case 'twitch':
        const twitchMatch = pathname.match(/^\/([\w]+)/);
        return twitchMatch ? twitchMatch[1] : null;
        
      default:
        return null;
    }
  } catch (e) {
    console.error('Error extracting username:', e);
    return null;
  }
}

// Fetch follower count from Twitter/X (requires API key)
async function getTwitterFollowers(username: string): Promise<number | null> {
  try {
    // deno-lint-ignore no-explicit-any
    const TWITTER_BEARER_TOKEN: any = Deno.env.get('TWITTER_BEARER_TOKEN');
    if (!TWITTER_BEARER_TOKEN) {
      console.warn('Twitter API token not configured');
      return null;
    }
    
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
        }
      }
    );
    
    if (!response.ok) return null;
    
    // deno-lint-ignore no-explicit-any
    const data: any = await response.json();
    return data?.data?.public_metrics?.followers_count || null;
  } catch (e) {
    console.error('Twitter fetch error:', e);
    return null;
  }
}

// Fetch follower count from YouTube (requires API key)
async function getYouTubeSubscribers(username: string): Promise<number | null> {
  try {
    // deno-lint-ignore no-explicit-any
    const YOUTUBE_API_KEY: any = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      console.warn('YouTube API key not configured');
      return null;
    }
    
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!searchResponse.ok) return null;
    
    // deno-lint-ignore no-explicit-any
    const searchData: any = await searchResponse.json();
    const channelId = searchData?.items?.[0]?.id?.channelId;
    
    if (!channelId) return null;
    
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!channelResponse.ok) return null;
    
    // deno-lint-ignore no-explicit-any
    const channelData: any = await channelResponse.json();
    const subCount = channelData?.items?.[0]?.statistics?.subscriberCount;
    
    return subCount ? parseInt(subCount) : null;
  } catch (e) {
    console.error('YouTube fetch error:', e);
    return null;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { socialLinks, profileId } = await req.json() as { socialLinks: SocialLink[]; profileId: string };
    
    if (!Array.isArray(socialLinks) || !profileId) {
      return new Response(
        JSON.stringify({ error: 'Invalid request - socialLinks array and profileId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verifiedLinks = await Promise.all(
      socialLinks.map(async (link: SocialLink) => {
        const platform = (link.platform || link.type || link.url).toLowerCase();
        const username = extractUsername(link.url, platform);
        
        if (!username) {
          return {
            ...link,
            is_verified: false,
            error: 'Could not extract username from URL'
          };
        }

        let verifiedFollowers: number | null = null;

        // Fetch real follower count based on platform
        if (platform.includes('twitter') || platform.includes('x.com') || platform === 'x') {
          verifiedFollowers = await getTwitterFollowers(username);
        } else if (platform.includes('youtube')) {
          verifiedFollowers = await getYouTubeSubscribers(username);
        }

        return {
          ...link,
          verified_followers: verifiedFollowers,
          last_verified: new Date().toISOString(),
          is_verified: verifiedFollowers !== null
        };
      })
    );

    // Update profile with verified follower counts
    // deno-lint-ignore no-explicit-any
    const supabaseUrl: any = Deno.env.get('SUPABASE_URL');
    // deno-lint-ignore no-explicit-any
    const supabaseKey: any = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        social_links: verifiedLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        verifiedLinks,
        message: 'Social follower counts verified successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Verification error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
