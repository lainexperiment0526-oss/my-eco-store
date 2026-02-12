
-- Add pricing and network fields to apps table
ALTER TABLE public.apps 
ADD COLUMN IF NOT EXISTS pricing_model text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS price_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'onetime',
ADD COLUMN IF NOT EXISTS network_type text NOT NULL DEFAULT 'mainnet',
ADD COLUMN IF NOT EXISTS notes text;

-- Add same fields to app_drafts table
ALTER TABLE public.app_drafts 
ADD COLUMN IF NOT EXISTS pricing_model text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS price_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'onetime',
ADD COLUMN IF NOT EXISTS network_type text NOT NULL DEFAULT 'mainnet',
ADD COLUMN IF NOT EXISTS notes text;

-- Create developer_earnings table to track per-app earnings
CREATE TABLE IF NOT EXISTS public.developer_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.pi_payments(id),
  total_amount numeric NOT NULL DEFAULT 0,
  developer_share numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view their own earnings"
ON public.developer_earnings FOR SELECT
USING (auth.uid() = developer_id);

CREATE POLICY "System can insert earnings"
ON public.developer_earnings FOR INSERT
WITH CHECK (true);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  pi_wallet_address text,
  txid text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view their own withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = developer_id);

CREATE POLICY "Developers can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Developers can update their own pending withdrawals"
ON public.withdrawal_requests FOR UPDATE
USING (auth.uid() = developer_id AND status = 'pending');

-- Admin policies for earnings and withdrawals
CREATE POLICY "Admins can view all earnings"
ON public.developer_earnings FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawal_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on withdrawal_requests
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
