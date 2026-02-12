-- Fix products schema to match application expectations
-- Adds missing columns and aligns names used across the app

DO $$
BEGIN
  -- Add title column if missing and migrate from name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.products ADD COLUMN title text;
    -- Populate from existing name column if present
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'name'
    ) THEN
      UPDATE public.products SET title = name WHERE title IS NULL;
    END IF;
  END IF;

  -- Ensure price column exists (numeric preferred); keep existing type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE public.products ADD COLUMN price numeric(12,2);
  END IF;

  -- Add description column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.products ADD COLUMN description text;
  END IF;

  -- Add profile_id column used by app; keep nullable to avoid immediate constraint requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN profile_id uuid;
  END IF;

  -- Add image column if missing (used in search UI)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image text;
  END IF;

  -- Add image_url column if missing (used in ProductDetail page)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image_url text;
  END IF;

  -- Add file_url column if missing (used in MerchantStorePreview)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE public.products ADD COLUMN file_url text;
  END IF;

  -- Ensure created_at exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN created_at timestamp with time zone DEFAULT now();
  END IF;

  -- Add updated_at for consistency with triggers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Optional: Create RLS policies similar to migrations if products table lacks them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public products are viewable by everyone'
  ) THEN
    CREATE POLICY "Public products are viewable by everyone" ON public.products FOR SELECT USING (true);
  END IF;
END $$;
