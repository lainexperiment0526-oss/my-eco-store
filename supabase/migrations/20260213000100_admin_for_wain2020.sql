-- Ensure admin role is granted for the Pi username "wain2020".
-- This applies to existing users and future profile creations.

CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'mrwainorganization@gmail.com'
     OR EXISTS (
       SELECT 1
       FROM auth.users au
       WHERE au.id = NEW.id
         AND lower(coalesce(au.raw_user_meta_data ->> 'pi_username', '')) = 'wain2020'
     ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Backfill existing users with pi_username = wain2020.
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::public.app_role
FROM auth.users au
WHERE lower(coalesce(au.raw_user_meta_data ->> 'pi_username', '')) = 'wain2020'
ON CONFLICT DO NOTHING;

