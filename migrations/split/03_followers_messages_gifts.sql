-- 03_followers_messages_gifts.sql
-- Followers, Messages, Gift Cards + indexes
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_profile_id, following_profile_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  receiver_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  receiver_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL DEFAULT 'general',
  message TEXT,
  amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'PI',
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_profile_id);
