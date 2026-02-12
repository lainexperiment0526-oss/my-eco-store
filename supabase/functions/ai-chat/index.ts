// Deno type declarations for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - Deno module (available at runtime)
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schema for request validation
const aiChatRequestSchema = z.object({
  profileId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1).max(100),
});

// Helper to get authenticated user and verify profile ownership
async function verifyProfileOwnership(req: Request, profileId: string) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Invalid or expired token');
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const serviceSupabase = createClient(supabaseUrl, serviceKey);
  
  // Verify profile ownership
  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('id, user_id')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('Profile not found or access denied');
  }

  return { user, profile, supabase: serviceSupabase };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate request with Zod
    const validationResult = aiChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, message, sessionId } = validationResult.data;

    // Verify profile ownership
    const { supabase } = await verifyProfileOwnership(req, profileId);

    // Fetch AI configuration (owner-only via RLS)
    const { data: config, error: configError } = await supabase
      .from('ai_support_config')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (configError) {
      throw new Error('Failed to fetch AI configuration');
    }

    if (!config || !config.enabled) {
      return new Response(JSON.stringify({ error: 'AI support is not enabled for this profile' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile info (owner-only)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, description')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Fetch recent chat history (owner-only)
    const { data: history, error: historyError } = await supabase
      .from('ai_chat_messages')
      .select('role, content')
      .eq('profile_id', profileId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Error fetching history:', historyError);
    }

    const messages = (history || []).reverse().map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Build system prompt (no sensitive data logging)
    let systemPrompt = `You are a helpful AI assistant for ${profile?.business_name || 'this business'}.`;
    
    if (profile?.description) {
      systemPrompt += ` About the business: ${profile.description}`;
    }
    
    if (config.business_info) {
      systemPrompt += `\n\nAdditional business information:\n${config.business_info}`;
    }
    
    if (config.faqs) {
      systemPrompt += `\n\nFrequently Asked Questions:\n${config.faqs}`;
    }
    
    if (config.custom_instructions) {
      systemPrompt += `\n\nSpecial instructions: ${config.custom_instructions}`;
    }

    systemPrompt += `\n\nBe helpful, friendly, and professional. If you don't know something, be honest about it.`;

    // Call OpenRouter AI API
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://droplink.vercel.app',
        'X-Title': Deno.env.get('SITE_NAME') || 'Droplink',
      },
      body: JSON.stringify({
        model: 'openrouter/sherlock-dash-alpha',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save messages to database (owner-only via RLS)
    const { error: saveError } = await supabase
      .from('ai_chat_messages')
      .insert([
        {
          profile_id: profileId,
          session_id: sessionId,
          role: 'user',
          content: message
        },
        {
          profile_id: profileId,
          session_id: sessionId,
          role: 'assistant',
          content: assistantMessage
        }
      ]);

    if (saveError) {
      console.error('Error saving messages:', saveError);
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
