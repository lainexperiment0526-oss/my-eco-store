
-- Create trigger to auto-assign admin role for specific email
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'mrwainorganization@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Attach trigger to profiles table (created on signup)
CREATE TRIGGER auto_admin_on_profile_create
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin_role();
