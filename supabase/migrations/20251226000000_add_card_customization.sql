-- Add card customization columns to profiles table
-- Default colors: Sky Blue theme (#2bbdee, #000000, #fafafa)

-- Add columns for card customization
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS card_front_color TEXT DEFAULT '#2bbdee',
ADD COLUMN IF NOT EXISTS card_back_color TEXT DEFAULT '#2bbdee',
ADD COLUMN IF NOT EXISTS card_text_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS card_accent_color TEXT DEFAULT '#fafafa',
ADD COLUMN IF NOT EXISTS card_customization_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS card_design_data JSONB DEFAULT '{"version": "1.0", "printReady": true, "mirrored": true}'::jsonb;

-- Update existing profiles to have default colors
UPDATE profiles
SET 
  card_front_color = COALESCE(card_front_color, '#2bbdee'),
  card_back_color = COALESCE(card_back_color, '#2bbdee'),
  card_text_color = COALESCE(card_text_color, '#000000'),
  card_accent_color = COALESCE(card_accent_color, '#fafafa'),
  card_customization_enabled = COALESCE(card_customization_enabled, FALSE),
  card_design_data = COALESCE(card_design_data, '{"version": "1.0", "printReady": true, "mirrored": true}'::jsonb);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_card_customization ON profiles(card_customization_enabled);
CREATE INDEX IF NOT EXISTS idx_profiles_card_design ON profiles USING GIN(card_design_data);

-- Add comments explaining the columns
COMMENT ON COLUMN profiles.card_front_color IS 'Front side background color of virtual card (hex code) - Default: #2bbdee';
COMMENT ON COLUMN profiles.card_back_color IS 'Back side background color of virtual card (hex code) - Default: #2bbdee';
COMMENT ON COLUMN profiles.card_text_color IS 'Text color for virtual card (hex code) - Default: #000000';
COMMENT ON COLUMN profiles.card_accent_color IS 'Accent/logo color for virtual card (hex code) - Default: #fafafa';
COMMENT ON COLUMN profiles.card_customization_enabled IS 'Whether user has Pro plan (30 Pi) and can customize card colors';
COMMENT ON COLUMN profiles.card_design_data IS 'Complete card design data including front/back layout, print settings, and mirroring info';

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile card settings" ON profiles;
DROP POLICY IF EXISTS "Users can update their own card settings" ON profiles;
DROP POLICY IF EXISTS "Public can view card colors" ON profiles;

-- Allow users to view their own card settings
CREATE POLICY "Users can view their own profile card settings"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own card settings (only if they have pro plan)
CREATE POLICY "Users can update their own card settings"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  (card_customization_enabled = true OR subscription_status = 'active')
);

-- Allow public to view card colors for card display in stores/sharing
CREATE POLICY "Public can view card colors"
ON profiles FOR SELECT
USING (true);

-- Function to enable card customization when user subscribes to Pro plan
CREATE OR REPLACE FUNCTION enable_card_customization_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription becomes active, enable card customization
  IF NEW.subscription_status = 'active' AND (OLD.subscription_status IS NULL OR OLD.subscription_status != 'active') THEN
    NEW.card_customization_enabled = TRUE;
  END IF;
  
  -- If subscription is cancelled, disable card customization and reset to defaults
  IF NEW.subscription_status = 'cancelled' AND OLD.subscription_status = 'active' THEN
    NEW.card_customization_enabled = FALSE;
    NEW.card_front_color = '#2bbdee';
    NEW.card_back_color = '#2bbdee';
    NEW.card_text_color = '#000000';
    NEW.card_accent_color = '#fafafa';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-enable/disable card customization based on subscription
DROP TRIGGER IF EXISTS trigger_enable_card_customization ON profiles;
CREATE TRIGGER trigger_enable_card_customization
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enable_card_customization_on_subscription();

