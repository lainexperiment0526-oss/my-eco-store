-- Add languages to drafts so language selection survives save/load draft flow.
ALTER TABLE public.app_drafts
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[];

-- Ensure requested submit categories exist.
INSERT INTO public.categories (name, icon, description)
VALUES
  ('Commerce', 'ShoppingCart', 'Commerce and e-commerce apps'),
  ('Games', 'Gamepad2', 'Games and gaming apps'),
  ('NFT', 'Gem', 'NFT and digital collectibles apps'),
  ('Social', 'Users', 'Social networking apps'),
  ('Education', 'GraduationCap', 'Learning and education apps'),
  ('AI', 'Bot', 'AI-powered applications'),
  ('Software', 'Code2', 'Software tools and applications'),
  ('Health & Fitness', 'Heart', 'Health and fitness apps'),
  ('Travel', 'Plane', 'Travel and booking apps'),
  ('Utilities', 'Settings', 'Useful utility applications'),
  ('Career', 'Briefcase', 'Career and job-related apps'),
  ('Entertainment', 'Play', 'Entertainment apps'),
  ('Finance', 'DollarSign', 'Finance and payments apps'),
  ('Lifestyle', 'Sparkles', 'Lifestyle and personal apps'),
  ('Music', 'Music', 'Music and audio apps'),
  ('Productivity', 'CheckSquare', 'Productivity and task apps'),
  ('Sports', 'Trophy', 'Sports apps'),
  ('Other', 'Grid3x3', 'Other applications')
ON CONFLICT (name) DO UPDATE
SET
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

