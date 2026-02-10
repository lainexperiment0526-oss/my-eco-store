
-- Create app_drafts table for saving draft apps before payment
CREATE TABLE public.app_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  website_url TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  tags TEXT[],
  version TEXT DEFAULT '1.0',
  logo_url TEXT,
  developer_name TEXT,
  age_rating TEXT DEFAULT '4+',
  whats_new TEXT,
  privacy_policy_url TEXT,
  developer_website_url TEXT,
  screenshot_urls TEXT[],
  video_ad_url TEXT,
  ad_title TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own drafts
CREATE POLICY "Users can view their own drafts"
ON public.app_drafts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
ON public.app_drafts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.app_drafts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.app_drafts FOR DELETE
USING (auth.uid() = user_id);

-- Create pi_payments table for tracking payments
CREATE TABLE public.pi_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_id TEXT NOT NULL,
  txid TEXT,
  amount NUMERIC NOT NULL,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, completed, cancelled
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pi_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.pi_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.pi_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
ON public.pi_payments FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_app_drafts_updated_at
BEFORE UPDATE ON public.app_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pi_payments_updated_at
BEFORE UPDATE ON public.pi_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
