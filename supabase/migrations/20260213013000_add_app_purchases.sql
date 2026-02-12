-- Track paid app access by user (one-time or monthly subscriptions).
CREATE TABLE IF NOT EXISTS public.app_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  purchase_type text NOT NULL CHECK (purchase_type IN ('onetime', 'monthly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  paid_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  last_payment_id uuid REFERENCES public.pi_payments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_app_purchases_user_id ON public.app_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_app_purchases_app_id ON public.app_purchases(app_id);

ALTER TABLE public.app_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own app purchases" ON public.app_purchases;
CREATE POLICY "Users can view own app purchases"
ON public.app_purchases
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert own app purchases" ON public.app_purchases;
CREATE POLICY "Users can insert own app purchases"
ON public.app_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own app purchases" ON public.app_purchases;
CREATE POLICY "Users can update own app purchases"
ON public.app_purchases
FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete own app purchases" ON public.app_purchases;
CREATE POLICY "Users can delete own app purchases"
ON public.app_purchases
FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_app_purchases_updated_at ON public.app_purchases;
CREATE TRIGGER update_app_purchases_updated_at
BEFORE UPDATE ON public.app_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

