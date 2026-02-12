-- Harden developer finance workflow integrity.

ALTER TABLE public.developer_earnings
DROP CONSTRAINT IF EXISTS developer_earnings_amounts_nonnegative_chk,
DROP CONSTRAINT IF EXISTS developer_earnings_split_chk;

ALTER TABLE public.developer_earnings
ADD CONSTRAINT developer_earnings_amounts_nonnegative_chk
  CHECK (total_amount >= 0 AND developer_share >= 0 AND platform_fee >= 0),
ADD CONSTRAINT developer_earnings_split_chk
  CHECK (round((developer_share + platform_fee)::numeric, 6) = round(total_amount::numeric, 6));

ALTER TABLE public.withdrawal_requests
DROP CONSTRAINT IF EXISTS withdrawal_requests_status_chk,
DROP CONSTRAINT IF EXISTS withdrawal_requests_amount_positive_chk,
DROP CONSTRAINT IF EXISTS withdrawal_requests_wallet_required_chk;

ALTER TABLE public.withdrawal_requests
ADD CONSTRAINT withdrawal_requests_status_chk
  CHECK (status IN ('pending', 'completed', 'rejected')),
ADD CONSTRAINT withdrawal_requests_amount_positive_chk
  CHECK (amount > 0),
ADD CONSTRAINT withdrawal_requests_wallet_required_chk
  CHECK (status <> 'pending' OR COALESCE(length(trim(pi_wallet_address)), 0) > 0);

CREATE INDEX IF NOT EXISTS idx_developer_earnings_developer_id ON public.developer_earnings(developer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_developer_status ON public.withdrawal_requests(developer_id, status);
