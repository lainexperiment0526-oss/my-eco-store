-- Add user category system to profiles table

-- Add category column for user categorization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Add check constraint for valid categories
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_category_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_category_check 
        CHECK (category IN ('content_creator', 'business', 'gamer', 'developer', 'artist', 'musician', 'educator', 'influencer', 'entrepreneur', 'other'));
    END IF;
END $$;

-- Create index for better performance when filtering by category
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);

-- Add documentation comment
COMMENT ON COLUMN public.profiles.category IS 'User category: content_creator, business, gamer, developer, artist, musician, educator, influencer, entrepreneur, other';

-- Success message
SELECT 'User categories added successfully! ✅' as status,
       'Categories: content_creator, business, gamer, developer, artist, musician, educator, influencer, entrepreneur, other' as available_categories,
       'Default: other' as default_value,
       'Column: profiles.category' as location;
