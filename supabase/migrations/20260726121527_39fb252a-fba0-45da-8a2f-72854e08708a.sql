CREATE TABLE public.openpay_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  openpay_user_id text,
  account_number text,
  username text,
  full_name text,
  avatar_url text,
  scope text,
  access_token text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, DELETE ON public.openpay_connections TO authenticated;
GRANT ALL ON public.openpay_connections TO service_role;

ALTER TABLE public.openpay_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own OpenPay connection"
ON public.openpay_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own OpenPay connection"
ON public.openpay_connections FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_openpay_connections_updated_at
BEFORE UPDATE ON public.openpay_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();