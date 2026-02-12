-- 11_triggers.sql
-- Timestamp triggers for profiles, links, products
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

CREATE OR REPLACE FUNCTION update_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS links_updated_at_trigger ON public.links;
CREATE TRIGGER links_updated_at_trigger
BEFORE UPDATE ON public.links
FOR EACH ROW
EXECUTE FUNCTION update_links_updated_at();

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at_trigger ON public.products;
CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();
