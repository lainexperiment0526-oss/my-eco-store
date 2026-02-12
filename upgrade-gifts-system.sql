-- Enhanced Gift System - Immediate Upgrade
-- Run this in Supabase SQL Editor to add more gift options

-- Add new columns to gifts table if they don't exist
ALTER TABLE gifts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS pi_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add Pi amount tracking to gift transactions
ALTER TABLE gift_transactions
ADD COLUMN IF NOT EXISTS pi_amount DECIMAL(10, 2) DEFAULT 0;

-- Update existing gifts with categories and Pi amounts
UPDATE gifts SET 
  category = 'food',
  pi_amount = 0.5,
  sort_order = 2,
  description = 'Buy me a coffee ☕'
WHERE name = 'Coffee';

UPDATE gifts SET 
  category = 'emotion',
  pi_amount = 0.75,
  sort_order = 3,
  description = 'Send some love ❤️'
WHERE name = 'Heart';

UPDATE gifts SET 
  category = 'achievement',
  pi_amount = 1.0,
  sort_order = 5,
  description = 'You rock! ⭐'
WHERE name = 'Star';

UPDATE gifts SET 
  category = 'achievement',
  pi_amount = 2.5,
  sort_order = 11,
  description = 'Champion! 🏆'
WHERE name = 'Trophy';

UPDATE gifts SET 
  category = 'premium',
  pi_amount = 5.0,
  sort_order = 12,
  description = 'Premium support 💎'
WHERE name = 'Diamond';

-- Insert new gift options
INSERT INTO public.gifts (name, icon, drop_token_cost, pi_amount, category, sort_order, description)
VALUES 
  -- Quick Appreciation (5-20 tokens)
  ('Like', '👍', 5, 0.25, 'emotion', 1, 'Quick like 👍'),
  ('Beer', '🍺', 20, 1.0, 'food', 4, 'Grab a beer 🍺'),
  
  -- Medium Support (25-50 tokens)
  ('Love', '😍', 25, 1.25, 'emotion', 6, 'Much love 😍'),
  ('Cake', '🎂', 30, 1.5, 'food', 7, 'Celebrate with cake 🎂'),
  ('Fire', '🔥', 30, 1.5, 'emotion', 8, 'You''re on fire! 🔥'),
  ('Medal', '🏅', 40, 2.0, 'achievement', 9, 'Medal of honor 🏅'),
  ('Pizza', '🍕', 50, 2.5, 'food', 10, 'Pizza time! 🍕'),
  
  -- Premium Gifts (100+ tokens)
  ('Crown', '👑', 100, 5.0, 'achievement', 13, 'Royal treatment 👑'),
  ('Gem', '💍', 150, 7.5, 'premium', 14, 'Precious gem 💍'),
  ('Gift Box', '🎁', 200, 10.0, 'premium', 15, 'Special gift 🎁'),
  ('Rocket', '🚀', 500, 25.0, 'premium', 16, 'To the moon! 🚀')
ON CONFLICT (name) DO UPDATE 
SET 
  icon = EXCLUDED.icon,
  drop_token_cost = EXCLUDED.drop_token_cost,
  pi_amount = EXCLUDED.pi_amount,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gifts_category ON gifts(category);
CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts(is_active);
CREATE INDEX IF NOT EXISTS idx_gifts_sort ON gifts(sort_order);

-- Verify the gifts
SELECT 
  name,
  icon,
  drop_token_cost,
  pi_amount,
  category,
  sort_order,
  description
FROM gifts
ORDER BY sort_order;
