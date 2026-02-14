
-- Fix the increment function to use views_count instead of downloads_count
CREATE OR REPLACE FUNCTION public.increment_app_downloads()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.apps
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = NEW.app_id;
  RETURN NEW;
END;
$function$;

-- Create trigger on app_views to auto-increment views_count
CREATE TRIGGER increment_views_on_insert
  AFTER INSERT ON public.app_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_app_downloads();
