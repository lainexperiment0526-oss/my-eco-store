-- Create payment_idempotency table for preventing duplicate payment processing
CREATE TABLE IF NOT EXISTS public.payment_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL UNIQUE,
  txid TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_idempotency ENABLE ROW LEVEL SECURITY;

-- Only service role can access (payments are processed server-side only)
CREATE POLICY "Service role can manage payment idempotency"
ON public.payment_idempotency
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add index for fast payment_id lookups
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_payment_id 
ON public.payment_idempotency(payment_id);

-- Add index for profile lookups
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_profile_id 
ON public.payment_idempotency(profile_id);

-- Trigger to update updated_at
CREATE TRIGGER update_payment_idempotency_updated_at
BEFORE UPDATE ON public.payment_idempotency
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();