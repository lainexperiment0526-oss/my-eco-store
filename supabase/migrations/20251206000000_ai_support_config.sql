-- Create AI Support Config table
-- This table manages AI chat support settings for each profile

CREATE TABLE IF NOT EXISTS public.ai_support_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Profile reference
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- AI support settings
    enabled BOOLEAN DEFAULT false,
    widget_position TEXT DEFAULT 'bottom-right' CHECK (widget_position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
    primary_color TEXT DEFAULT '#3b82f6',
    greeting_message TEXT DEFAULT 'Hi! How can I help you today?',
    
    -- AI configuration
    ai_model TEXT DEFAULT 'gpt-3.5-turbo',
    max_messages_per_session INTEGER DEFAULT 50,
    auto_open BOOLEAN DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_support_config_profile_id ON public.ai_support_config(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_support_config_enabled ON public.ai_support_config(enabled);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_timestamp_ai_support_config ON public.ai_support_config;
CREATE TRIGGER set_timestamp_ai_support_config
    BEFORE UPDATE ON public.ai_support_config
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS
ALTER TABLE public.ai_support_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own AI config" ON public.ai_support_config;
CREATE POLICY "Users can view their own AI config" ON public.ai_support_config
    FOR SELECT USING (
        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR pi_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own AI config" ON public.ai_support_config;
CREATE POLICY "Users can update their own AI config" ON public.ai_support_config
    FOR UPDATE USING (
        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR pi_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their own AI config" ON public.ai_support_config;
CREATE POLICY "Users can insert their own AI config" ON public.ai_support_config
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR pi_user_id = auth.uid())
    );

-- Grant permissions
GRANT SELECT ON public.ai_support_config TO authenticated;
GRANT SELECT ON public.ai_support_config TO anon;
GRANT INSERT, UPDATE, DELETE ON public.ai_support_config TO authenticated;

-- Success message
SELECT 'AI Support Config table created successfully!' as status;
