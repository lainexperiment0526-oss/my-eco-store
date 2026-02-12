-- Harden submit-app data integrity for apps and drafts.
-- Backfill first so constraints can be added safely.

-- Normalize invalid pricing and payment values on apps.
UPDATE public.apps
SET pricing_model = 'free'
WHERE pricing_model IS NULL OR pricing_model NOT IN ('free', 'paid');

UPDATE public.apps
SET network_type = 'mainnet'
WHERE network_type IS NULL OR network_type NOT IN ('mainnet', 'testnet', 'beta');

UPDATE public.apps
SET payment_type = CASE
  WHEN pricing_model = 'paid' AND payment_type IN ('onetime', 'monthly') THEN payment_type
  WHEN pricing_model = 'paid' THEN 'onetime'
  ELSE 'free'
END;

UPDATE public.apps
SET price_amount = CASE
  WHEN pricing_model = 'paid' THEN GREATEST(COALESCE(price_amount, 0), 0.01)
  ELSE 0
END;

UPDATE public.apps
SET languages = ARRAY['English']::text[]
WHERE languages IS NULL OR COALESCE(array_length(languages, 1), 0) = 0;

-- Normalize invalid pricing and payment values on app drafts.
UPDATE public.app_drafts
SET pricing_model = 'free'
WHERE pricing_model IS NULL OR pricing_model NOT IN ('free', 'paid');

UPDATE public.app_drafts
SET network_type = 'mainnet'
WHERE network_type IS NULL OR network_type NOT IN ('mainnet', 'testnet', 'beta');

UPDATE public.app_drafts
SET payment_type = CASE
  WHEN pricing_model = 'paid' AND payment_type IN ('onetime', 'monthly') THEN payment_type
  WHEN pricing_model = 'paid' THEN 'onetime'
  ELSE 'free'
END;

UPDATE public.app_drafts
SET price_amount = CASE
  WHEN pricing_model = 'paid' THEN GREATEST(COALESCE(price_amount, 0), 0.01)
  ELSE 0
END;

UPDATE public.app_drafts
SET languages = ARRAY['English']::text[]
WHERE languages IS NULL OR COALESCE(array_length(languages, 1), 0) = 0;

-- Keep defaults aligned with submit form behavior.
ALTER TABLE public.apps
ALTER COLUMN pricing_model SET DEFAULT 'free',
ALTER COLUMN payment_type SET DEFAULT 'free',
ALTER COLUMN network_type SET DEFAULT 'mainnet',
ALTER COLUMN price_amount SET DEFAULT 0,
ALTER COLUMN languages SET DEFAULT ARRAY['English']::text[];

ALTER TABLE public.app_drafts
ALTER COLUMN pricing_model SET DEFAULT 'free',
ALTER COLUMN payment_type SET DEFAULT 'free',
ALTER COLUMN network_type SET DEFAULT 'mainnet',
ALTER COLUMN price_amount SET DEFAULT 0,
ALTER COLUMN languages SET DEFAULT ARRAY['English']::text[];

-- Replace constraints to ensure current behavior is always valid.
ALTER TABLE public.apps
DROP CONSTRAINT IF EXISTS apps_pricing_model_chk,
DROP CONSTRAINT IF EXISTS apps_network_type_chk,
DROP CONSTRAINT IF EXISTS apps_price_amount_nonnegative_chk,
DROP CONSTRAINT IF EXISTS apps_languages_nonempty_chk,
DROP CONSTRAINT IF EXISTS apps_paid_values_chk;

ALTER TABLE public.apps
ADD CONSTRAINT apps_pricing_model_chk
  CHECK (pricing_model IN ('free', 'paid')),
ADD CONSTRAINT apps_network_type_chk
  CHECK (network_type IN ('mainnet', 'testnet', 'beta')),
ADD CONSTRAINT apps_price_amount_nonnegative_chk
  CHECK (COALESCE(price_amount, 0) >= 0),
ADD CONSTRAINT apps_languages_nonempty_chk
  CHECK (COALESCE(array_length(languages, 1), 0) > 0),
ADD CONSTRAINT apps_paid_values_chk
  CHECK (
    (pricing_model = 'free' AND payment_type = 'free' AND COALESCE(price_amount, 0) = 0)
    OR
    (pricing_model = 'paid' AND payment_type IN ('onetime', 'monthly') AND COALESCE(price_amount, 0) > 0)
  );

ALTER TABLE public.app_drafts
DROP CONSTRAINT IF EXISTS app_drafts_pricing_model_chk,
DROP CONSTRAINT IF EXISTS app_drafts_network_type_chk,
DROP CONSTRAINT IF EXISTS app_drafts_price_amount_nonnegative_chk,
DROP CONSTRAINT IF EXISTS app_drafts_languages_nonempty_chk,
DROP CONSTRAINT IF EXISTS app_drafts_paid_values_chk;

ALTER TABLE public.app_drafts
ADD CONSTRAINT app_drafts_pricing_model_chk
  CHECK (pricing_model IN ('free', 'paid')),
ADD CONSTRAINT app_drafts_network_type_chk
  CHECK (network_type IN ('mainnet', 'testnet', 'beta')),
ADD CONSTRAINT app_drafts_price_amount_nonnegative_chk
  CHECK (COALESCE(price_amount, 0) >= 0),
ADD CONSTRAINT app_drafts_languages_nonempty_chk
  CHECK (COALESCE(array_length(languages, 1), 0) > 0),
ADD CONSTRAINT app_drafts_paid_values_chk
  CHECK (
    (pricing_model = 'free' AND payment_type = 'free' AND COALESCE(price_amount, 0) = 0)
    OR
    (pricing_model = 'paid' AND payment_type IN ('onetime', 'monthly') AND COALESCE(price_amount, 0) > 0)
  );
