-- Create withdrawals table for managing withdrawal requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(15, 6) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS withdrawals_profile_id_idx ON public.withdrawals(profile_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS withdrawals_requested_at_idx ON public.withdrawals(requested_at DESC);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  -- Users can view their own withdrawals
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'withdrawals' AND policyname = 'Users can view own withdrawals'
  ) THEN
    CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
      FOR SELECT USING (profile_id = (
        SELECT id FROM profiles WHERE username = current_user
      ));
  END IF;

  -- Users can insert their own withdrawal requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'withdrawals' AND policyname = 'Users can request withdrawals'
  ) THEN
    CREATE POLICY "Users can request withdrawals" ON public.withdrawals
      FOR INSERT WITH CHECK (profile_id = (
        SELECT id FROM profiles WHERE username = current_user
      ));
  END IF;

  -- Admin can view and update all withdrawals
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'withdrawals' AND policyname = 'Admin can manage withdrawals'
  ) THEN
    CREATE POLICY "Admin can manage withdrawals" ON public.withdrawals
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND is_admin = true)
      );
  END IF;
END $$;
