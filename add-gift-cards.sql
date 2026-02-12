-- Add gift cards feature to DropLink
-- Users can buy gift cards and share codes with friends/loved ones

-- Create gift_cards table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'premium', 'pro')),
  billing_period VARCHAR(10) NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  pi_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  
  -- Purchaser info
  purchased_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Redeemer info
  redeemed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  message TEXT,
  recipient_email VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchased_by ON public.gift_cards(purchased_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_redeemed_by ON public.gift_cards(redeemed_by_profile_id);

-- Function to generate unique gift card code
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS VARCHAR(16) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding similar chars
  result VARCHAR(16) := 'DL';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := 'DL';
    FOR i IN 1..14 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update gift card timestamp
CREATE OR REPLACE FUNCTION update_gift_card_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp
DROP TRIGGER IF EXISTS update_gift_cards_timestamp ON public.gift_cards;
CREATE TRIGGER update_gift_cards_timestamp
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_timestamp();

-- Function to expire old gift cards
CREATE OR REPLACE FUNCTION expire_old_gift_cards()
RETURNS void AS $$
BEGIN
  UPDATE public.gift_cards
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.gift_cards IS 'Gift cards that can be purchased and redeemed for DropLink subscriptions';
COMMENT ON COLUMN public.gift_cards.code IS 'Unique redemption code (e.g., DL-XXXX-XXXX-XXXX)';
COMMENT ON COLUMN public.gift_cards.plan_type IS 'Type of plan this gift card provides (basic, premium, pro)';
COMMENT ON COLUMN public.gift_cards.billing_period IS 'Billing period for the subscription (monthly, yearly)';
COMMENT ON COLUMN public.gift_cards.status IS 'Current status of the gift card';
COMMENT ON COLUMN public.gift_cards.message IS 'Optional message from purchaser to recipient';

-- Success message
SELECT 'Gift cards table created successfully! ✅' as status;
