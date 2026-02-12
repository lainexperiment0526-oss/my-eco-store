-- Create gift_cards table for gift card functionality
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  pi_amount INTEGER NOT NULL DEFAULT 0,
  purchased_by_profile_id UUID REFERENCES public.profiles(id),
  redeemed_by_profile_id UUID REFERENCES public.profiles(id),
  recipient_email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 year'),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Policies for gift_cards
CREATE POLICY "Anyone can view active gift cards by code" 
ON public.gift_cards 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create gift cards" 
ON public.gift_cards 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update gift cards they own or redeem" 
ON public.gift_cards 
FOR UPDATE 
USING (true);

-- Create function to generate gift card code
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a random code: GIFT-XXXX-XXXX
    code := 'GIFT-' || 
            upper(substr(md5(random()::text), 1, 4)) || '-' ||
            upper(substr(md5(random()::text), 1, 4));
    
    -- Check if code exists
    SELECT COUNT(*) INTO exists_count FROM public.gift_cards WHERE gift_cards.code = code;
    
    -- Exit loop if unique
    EXIT WHEN exists_count = 0;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_gift_cards_updated_at
BEFORE UPDATE ON public.gift_cards
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();