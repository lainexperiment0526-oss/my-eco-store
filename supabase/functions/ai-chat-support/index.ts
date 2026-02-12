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

// Simple AI response generation
const generateAIResponse = (userMessage: string, context: any = {}): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greetings = [
      "Hello! I'm your AI assistant. How can I help you today?",
      "Hi there! I'm here to help you with your DropLink profile and any questions you might have.",
      "Hey! Welcome to DropLink. What can I assist you with?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Help and support
  if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return `I'm here to help! Here's what I can assist you with:

📎 **Link Management**
• Creating and customizing short links
• QR code generation and download
• Analytics and tracking

🎨 **Profile Customization**
• Theme selection and customization
• Adding custom links and content
• Upload backgrounds and media

💼 **Premium Features**
• Subscription plans and benefits
• Advanced analytics
• Custom domains

🔧 **Technical Support**
• Troubleshooting issues
• Account management
• Feature tutorials

What would you like to know more about?`;
  }
  
  // Link shortening help
  if (lowerMessage.includes('link') || lowerMessage.includes('shorten') || lowerMessage.includes('url')) {
    return `🔗 **Link Shortening Made Easy!**

Here's how to create powerful short links:

1. **Basic Shortening**: Paste any long URL and get an instant short link
2. **Custom Aliases**: Create memorable links like drop.link/mystore
3. **Rich Previews**: Add titles, descriptions, and thumbnails
4. **Display Styles**: Choose from Classic, Featured, or Animated styles
5. **QR Codes**: Automatically generated for every link
6. **Analytics**: Track clicks, visitors, and engagement

**Pro Tip**: Use the Featured style for your most important links to make them stand out!

Would you like me to guide you through creating your first short link?`;
  }
  
  // QR code help
  if (lowerMessage.includes('qr') || lowerMessage.includes('code')) {
    return `📱 **QR Code Features**

Every shortened link gets a free QR code with these benefits:

✅ **High Quality**: Download in PNG format, perfect for print
✅ **Customizable**: Choose size, colors, and error correction
✅ **Analytics**: Track scans and engagement
✅ **Mobile Optimized**: Works with any smartphone camera

**Use Cases**:
• Business cards and flyers
• Product packaging
• Event posters
• Social media posts
• Restaurant menus

Want me to show you how to customize your QR codes?`;
  }
  
  // AI chat customization
  if (lowerMessage.includes('chat') || lowerMessage.includes('bot') || lowerMessage.includes('customize')) {
    return `🤖 **AI Chat Customization**

You can fully customize your AI assistant:

🎨 **Appearance**
• Colors, fonts, and sizes
• Position on your page
• Animations and effects

💬 **Behavior**
• Custom welcome message
• Bot name and personality
• Response settings

🔧 **Advanced**
• Auto-open settings
• Sound notifications
• Typing indicators
• Custom CSS styling

Your visitors will love having instant support! Want to customize your chat design?`;
  }
  
  // Premium features
  if (lowerMessage.includes('premium') || lowerMessage.includes('upgrade') || lowerMessage.includes('pro')) {
    return `⭐ **Premium Features**

Unlock powerful tools with DropLink Premium:

🌟 **Premium Plan (π10/month)**
• Custom domains (yourbrand.com)
• Advanced analytics dashboard
• Remove DropLink branding
• Priority support

🚀 **Pro Plan (π20/month)**
• Everything in Premium
• Bulk link creation
• API access for automation
• White-label QR codes
• Team collaboration
• Advanced integrations

💰 **Save with Yearly Plans**
• Premium: π100/year (2 months free!)
• Pro: π200/year (2 months free!)

Ready to upgrade your link game?`;
  }
  
  // Analytics help
  if (lowerMessage.includes('analytics') || lowerMessage.includes('stats') || lowerMessage.includes('tracking')) {
    return `📊 **Powerful Analytics**

Track your link performance with detailed insights:

📈 **Click Metrics**
• Total clicks and unique visitors
• Click trends over time
• Peak activity periods

🌍 **Audience Insights**
• Geographic distribution
• Device and browser data
• Referral sources

🎯 **Engagement Data**
• Click-through rates
• Popular links ranking
• Conversion tracking

**Pro Tip**: Use analytics to optimize your content strategy and understand your audience better!

Want to dive deeper into your link performance?`;
  }
  
  // Technical issues
  if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
    return `🔧 **Technical Support**

I'm here to help resolve any issues:

**Common Solutions:**
• **Can't save changes?** Try refreshing the page and logging in again
• **Links not working?** Check if they're still active and not expired
• **Upload issues?** Ensure images are under 5MB and in supported formats
• **Mobile display?** Clear your browser cache and try again

**Still having trouble?**
1. Try logging out and back in
2. Clear your browser cache
3. Try a different browser
4. Check your internet connection

If the issue persists, I can escalate to our human support team. What specific problem are you experiencing?`;
  }
  
  // Display styles
  if (lowerMessage.includes('style') || lowerMessage.includes('display') || lowerMessage.includes('featured') || lowerMessage.includes('animated')) {
    return `🎨 **Link Display Styles**

Choose the perfect style for your links:

📝 **Classic**
• Clean, minimal design
• Efficient and professional
• Perfect for most use cases
• Fast loading

⭐ **Featured**
• Larger, eye-catching display
• Perfect for important links
• Includes star indicator
• Great for promotions

✨ **Animated**
• Attention-grabbing animations
• Pulse effects and hover states
• Ideal for call-to-action links
• Increased engagement

**Pro Tip**: Use Featured for your main offerings and Animated for limited-time promotions!

Which style would work best for your links?`;
  }
  
  // Default response for unrecognized queries
  const defaultResponses = [
    `I understand you're asking about "${userMessage}". While I'm constantly learning, let me help you in a different way. You can try:

• Rephrasing your question
• Asking about specific DropLink features
• Contacting our human support team

What specific aspect of DropLink would you like to explore?`,
    
    `Thanks for your question about "${userMessage}". I'm here to help with:

🔗 Link shortening and management
🎨 Profile customization
📱 QR code generation
📊 Analytics and tracking
💬 Chat customization
⭐ Premium features

What would you like to know more about?`,
    
    `I want to make sure I give you the best help possible. For "${userMessage}", could you provide more details? 

Meanwhile, I can assist with:
• Creating short links
• Customizing your profile
• Understanding analytics
• Upgrading features

How can I help you succeed with DropLink?`
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // GET: Retrieve conversations or designs
    if (req.method === 'GET') {
      if (action === 'conversations') {
        const profileId = url.searchParams.get('profile_id');
        const sessionId = url.searchParams.get('session_id');
        
        let query = serviceSupabase
          .from('ai_chat_conversations')
          .select(`
            *,
            ai_chat_messages(*)
          `);

        if (profileId) {
          query = query.eq('profile_id', profileId);
        }
        if (sessionId) {
          query = query.eq('session_id', sessionId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'design') {
        const profileId = url.searchParams.get('profile_id');
        
        if (!profileId) {
          throw new Error('Profile ID required');
        }

        const { data, error } = await serviceSupabase
          .from('chatbot_designs')
          .select('*')
          .eq('profile_id', profileId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        return new Response(
          JSON.stringify({ success: true, data: data || null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Invalid GET action');
    }

    // POST: Send message or update design
    if (req.method === 'POST') {
      const body = await req.json();

      if (action === 'message') {
        const {
          profileId,
          sessionId,
          message,
          conversationId,
          userAgent,
          ipAddress
        } = body;

        let conversation;

        // Get or create conversation
        if (conversationId) {
          const { data } = await serviceSupabase
            .from('ai_chat_conversations')
            .select('*')
            .eq('id', conversationId)
            .single();
          conversation = data;
        } else {
          // Create new conversation
          const { data, error } = await serviceSupabase
            .from('ai_chat_conversations')
            .insert({
              profile_id: profileId,
              session_id: sessionId || `session_${Date.now()}`,
              visitor_ip: ipAddress,
              user_agent: userAgent,
              is_authenticated: !!profileId,
              status: 'active'
            })
            .select()
            .single();

          if (error) throw error;
          conversation = data;
        }

        // Save user message
        const { data: userMessage, error: userError } = await serviceSupabase
          .from('ai_chat_messages')
          .insert({
            conversation_id: conversation.id,
            content: message,
            is_bot: false,
            message_type: 'text'
          })
          .select()
          .single();

        if (userError) throw userError;

        // Generate AI response
        const aiResponseText = generateAIResponse(message, {
          profileId,
          conversationHistory: [] // You could pass recent messages for context
        });

        // Save AI response
        const { data: aiMessage, error: aiError } = await serviceSupabase
          .from('ai_chat_messages')
          .insert({
            conversation_id: conversation.id,
            content: aiResponseText,
            is_bot: true,
            message_type: 'text',
            ai_confidence: 0.85 + Math.random() * 0.15,
            ai_model_used: 'droplink-ai-v1',
            processing_time_ms: Math.floor(1000 + Math.random() * 2000)
          })
          .select()
          .single();

        if (aiError) throw aiError;

        // Update conversation message count - get current count first
        const { data: currentConv } = await serviceSupabase
          .from('ai_chat_conversations')
          .select('message_count')
          .eq('id', conversation.id)
          .single();

        await serviceSupabase
          .from('ai_chat_conversations')
          .update({
            message_count: (currentConv?.message_count || 0) + 2,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        console.log(`💬 AI Chat: User: "${message}" -> AI: "${aiResponseText.substring(0, 50)}..."`);

        return new Response(
          JSON.stringify({
            success: true,
            conversation: conversation,
            userMessage: userMessage,
            aiMessage: aiMessage
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'update-design') {
        const { profileId, design } = body;

        const { data, error } = await serviceSupabase
          .from('chatbot_designs')
          .upsert({
            profile_id: profileId,
            ...design,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'profile_id'
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`🎨 Updated chatbot design for profile ${profileId}`);

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'end-conversation') {
        const { conversationId, satisfactionRating } = body;

        const { data, error } = await serviceSupabase
          .from('ai_chat_conversations')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            satisfaction_rating: satisfactionRating,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Invalid POST action');
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error("AI Chat error:", error);
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
