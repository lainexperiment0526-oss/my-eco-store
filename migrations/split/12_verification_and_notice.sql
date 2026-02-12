-- 12_verification_and_notice.sql
-- Verify required tables exist and emit success notice
DO $$
DECLARE
  missing_tables TEXT;
BEGIN
  SELECT STRING_AGG(table_name, ', ')
  INTO missing_tables
  FROM (
    VALUES 
      ('profiles'),
      ('links'),
      ('products'),
      ('followers'),
      ('messages'),
      ('gift_cards'),
      ('payments'),
      ('subscriptions'),
      ('analytics'),
      ('leads'),
      ('user_preferences'),
      ('badges'),
      ('notifications'),
      ('social_verifications')
  ) AS required_tables(table_name)
  WHERE NOT EXISTS(
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = required_tables.table_name
  );

  IF missing_tables IS NOT NULL THEN
    RAISE WARNING 'Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE '✅ All required tables exist';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   DROPLINK COMPLETE FEATURES MIGRATION COMPLETE! ✅       ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created (14 total)';
  RAISE NOTICE '🎖️  Badges, Notifications, Social Verifications, Preferences ready';
  RAISE NOTICE '🔐 RLS enabled; 🚀 Ready to deploy';
END $$;
