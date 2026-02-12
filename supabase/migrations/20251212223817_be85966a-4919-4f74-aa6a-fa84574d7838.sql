-- Fix: Drop the problematic trigger that causes RLS violation during Pi authentication
-- User preferences are stored in localStorage, so this database table/trigger is not needed

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.profiles;

-- Drop the function
DROP FUNCTION IF EXISTS create_default_user_preferences();

-- Drop the user_preferences table if it exists (not needed - localStorage is used)
DROP TABLE IF EXISTS public.user_preferences CASCADE;