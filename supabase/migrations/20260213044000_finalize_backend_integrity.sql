-- Final backend integrity hardening for payment and app status workflows.

-- Keep one row per Pi payment identifier.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY payment_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.pi_payments
)
DELETE FROM public.pi_payments p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

ALTER TABLE public.pi_payments
DROP CONSTRAINT IF EXISTS pi_payments_payment_id_key;

ALTER TABLE public.pi_payments
ADD CONSTRAINT pi_payments_payment_id_key UNIQUE (payment_id);

-- Prevent duplicate earnings records for the same payment/developer pair.
CREATE UNIQUE INDEX IF NOT EXISTS uq_developer_earnings_payment_developer
ON public.developer_earnings(payment_id, developer_id)
WHERE payment_id IS NOT NULL;

-- Ensure app status and draft payment status are valid.
ALTER TABLE public.apps
DROP CONSTRAINT IF EXISTS apps_status_chk;

ALTER TABLE public.apps
ADD CONSTRAINT apps_status_chk
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.app_drafts
DROP CONSTRAINT IF EXISTS app_drafts_payment_status_chk;

ALTER TABLE public.app_drafts
ADD CONSTRAINT app_drafts_payment_status_chk
CHECK (payment_status IN ('pending', 'paid', 'cancelled'));

-- Keep verified-badge fields coherent.
ALTER TABLE public.apps
DROP CONSTRAINT IF EXISTS apps_verified_fields_chk;

ALTER TABLE public.apps
ADD CONSTRAINT apps_verified_fields_chk
CHECK (
  (is_verified = false AND verified_until IS NULL)
  OR
  (is_verified = true AND verified_until IS NOT NULL)
);
