-- Fix notifications schema to add missing columns used by the app
-- Adds `payload` jsonb column if absent and related optional columns

DO $$
BEGIN
  -- payload jsonb with default {}
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'payload'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN payload jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- action_url text with default empty string
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN action_url text DEFAULT ''::text;
  END IF;

  -- delivered boolean
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'delivered'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN delivered boolean DEFAULT false;
  END IF;

  -- delivery_channel text check (optional; no check here to avoid failures)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'delivery_channel'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN delivery_channel text;
  END IF;

  -- webhook_url text
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'webhook_url'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN webhook_url text;
  END IF;

  -- updated_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;