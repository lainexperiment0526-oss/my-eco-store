-- Migration: create pi_users table and RLS policies

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pi_users table
CREATE TABLE IF NOT EXISTS pi_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pi_uid text UNIQUE NOT NULL,
  pi_username text,
  display_name text,
  profile_picture text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Grant minimal privileges (owner should be the DB owner)
GRANT SELECT, INSERT, UPDATE, DELETE ON pi_users TO postgres;

-- Enable Row Level Security and add basic policies
ALTER TABLE pi_users ENABLE ROW LEVEL SECURITY;

-- Allow service role (authenticated server) to insert or update
-- Replace 'service_role' with your actual service role role if different
CREATE POLICY "service_role_upsert" ON pi_users
  FOR ALL
  USING ( current_setting('request.jwt.claims.role', true) = 'service_role' )
  WITH CHECK ( current_setting('request.jwt.claims.role', true) = 'service_role' );

-- Public read policy for basic fields (optional)
CREATE POLICY "public_read_basic" ON pi_users
  FOR SELECT
  USING ( true );

-- Trigger to update `updated_at` on changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON pi_users;
CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON pi_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Notes:
-- - For production, you should restrict the `service_role_upsert` policy to the Supabase service role
--   by using `auth.uid()` or JWT claims checks. The example uses request.jwt.claims.role placeholder.
-- - Apply RLS policies consistent with your Supabase Auth setup.
