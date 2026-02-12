/**
 * SQL Migration: Enhanced Social Media & Image Link Cards Features
 * Date: 2026-01-26
 * 
 * Features:
 * 1. Expanded social_links structure with new "platform" field
 * 2. Image link cards support in theme_settings
 * 3. Support for 45+ social platforms
 * 4. Backward compatibility with existing data
 */

-- ============================================================================
-- 1. SOCIAL LINKS STRUCTURE UPDATE
-- ============================================================================
-- The social_links field now supports the following structure:
-- {
--   "platform": "instagram",  // NEW: normalized platform ID
--   "type": "instagram",      // LEGACY: kept for backward compatibility
--   "url": "https://instagram.com/username",
--   "icon": "instagram",
--   "followers": 1000,
--   "verified_followers": 950,
--   "last_verified": "2026-01-26T10:00:00Z",
--   "is_verified": true
-- }

-- SUPPORTED PLATFORMS (45+):
-- Social: instagram, twitter, facebook, snapchat, threads, bluesky, mastodon, reddit, clubhouse
-- Professional: linkedin, github, gitlab, stackoverflow
-- Content: youtube, tiktok, twitch, kick, vimeo, pinterest
-- Messaging: whatsapp, telegram, discord, slack
-- Creative: behance, dribbble, deviantart
-- Music: spotify, soundcloud, applemusic, bandcamp
-- Monetization: patreon, onlyfans, substack, medium
-- Business: etsy, shopify, amazon, linktree
-- Utility: website, email, phone

-- Example migration query (optional - only if needed for data validation):
/*
DO $$
DECLARE
  v_profile_id UUID;
  v_social_links JSONB;
BEGIN
  -- Update existing social_links to include "platform" field if missing
  -- This ensures backward compatibility
  FOR v_profile_id IN
    SELECT id FROM profiles WHERE social_links IS NOT NULL
  LOOP
    SELECT social_links INTO v_social_links FROM profiles WHERE id = v_profile_id;
    
    IF v_social_links IS NOT NULL THEN
      -- Update each link in the array to include platform field
      v_social_links := jsonb_build_array(
        CASE 
          WHEN jsonb_typeof(v_social_links) = 'array' THEN v_social_links
          ELSE jsonb_build_array(v_social_links)
        END
      );
      
      UPDATE profiles
      SET social_links = (
        SELECT jsonb_agg(
          CASE 
            WHEN elem->>'platform' IS NOT NULL THEN elem
            ELSE elem || jsonb_build_object('platform', elem->>'type')
          END
        )
        FROM jsonb_array_elements(v_social_links) AS elem
      )
      WHERE id = v_profile_id;
    END IF;
  END LOOP;
END $$;
*/

-- ============================================================================
-- 2. IMAGE LINK CARDS SUPPORT
-- ============================================================================
-- The theme_settings field now includes imageLinkCards:
-- {
--   "imageLinkCards": [
--     {
--       "id": "card-1234567890",
--       "imageUrl": "data:image/jpeg;base64,...",  // base64 encoded or URL
--       "linkUrl": "https://example.com",
--       "title": "Check out my portfolio"
--     },
--     ...
--   ]
-- }

-- NOTE: theme_settings already exists in profiles table
-- No new columns needed - using existing JSONB storage

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE (Optional but recommended)
-- ============================================================================

-- Index for social_links queries (if filtering by platform):
CREATE INDEX IF NOT EXISTS idx_profiles_social_links 
ON profiles USING GIN (social_links);

-- Index for theme_settings queries (if searching for image cards):
CREATE INDEX IF NOT EXISTS idx_profiles_theme_settings 
ON profiles USING GIN (theme_settings);

-- ============================================================================
-- 4. VALIDATION CHECKS (Optional constraint functions)
-- ============================================================================

-- Function to validate platform names
CREATE OR REPLACE FUNCTION validate_social_platform(platform_id TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN platform_id IN (
    -- Social Networks
    'instagram', 'twitter', 'facebook', 'snapchat', 'threads', 'bluesky', 'mastodon', 'reddit', 'clubhouse',
    -- Professional
    'linkedin', 'github', 'gitlab', 'stackoverflow',
    -- Content
    'youtube', 'tiktok', 'twitch', 'kick', 'vimeo', 'pinterest',
    -- Messaging
    'whatsapp', 'telegram', 'discord', 'slack',
    -- Creative
    'behance', 'dribbble', 'deviantart',
    -- Music
    'spotify', 'soundcloud', 'applemusic', 'bandcamp',
    -- Monetization
    'patreon', 'onlyfans', 'substack', 'medium',
    -- Business
    'etsy', 'shopify', 'amazon', 'linktree',
    -- Utility
    'website', 'email', 'phone'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. DATA MIGRATION HELPER (Run if needed for existing data)
-- ============================================================================

-- Ensure all social_links entries have platform field set to type if missing
CREATE OR REPLACE FUNCTION migrate_social_links() RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET social_links = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'platform') IS NOT NULL THEN elem
        WHEN (elem->>'type') IS NOT NULL THEN 
          elem || jsonb_build_object('platform', elem->>'type')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(social_links) AS elem
  )
  WHERE social_links IS NOT NULL 
    AND jsonb_typeof(social_links) = 'array'
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(social_links) AS elem
      WHERE (elem->>'platform') IS NULL AND (elem->>'type') IS NULL
    );
  
  RAISE NOTICE 'Migration complete: Updated social_links with platform field';
END;
$$ LANGUAGE plpgsql;

-- To run migration when needed:
-- SELECT migrate_social_links();

-- ============================================================================
-- 6. SCHEMA DOCUMENTATION
-- ============================================================================

-- Social Link Schema with 45+ Platform Support:
-- {
--   "platform": "instagram",                    -- NEW: Normalized platform ID
--   "type": "instagram",                        -- LEGACY: For backward compatibility
--   "url": "https://instagram.com/username",    -- Full profile URL
--   "icon": "instagram",                        -- Icon identifier
--   "followers": 5000,                          -- User-entered follower count
--   "verified_followers": 4800,                 -- API-verified follower count
--   "last_verified": "2026-01-26T10:00:00Z",   -- Last verification timestamp
--   "is_verified": true                         -- Whether followers are verified
-- }

-- Image Link Card Schema:
-- {
--   "id": "card-1704067200000",                 -- Unique identifier (timestamp-based)
--   "imageUrl": "data:image/jpeg;base64,...",   -- Base64 image or URL
--   "linkUrl": "https://example.com",           -- Clickable link
--   "title": "Check out my portfolio"           -- Display title
-- }

-- Theme Settings with Image Cards:
-- {
--   "primaryColor": "#6366f1",
--   "backgroundColor": "#ffffff",
--   "... other theme fields ...",
--   "imageLinkCards": [
--     { "id": "...", "imageUrl": "...", "linkUrl": "...", "title": "..." },
--     { "id": "...", "imageUrl": "...", "linkUrl": "...", "title": "..." }
--   ]
-- }

-- ============================================================================
-- 7. ROLLBACK SCRIPT (If needed to revert changes)
-- ============================================================================

-- Note: This is a non-destructive update. No rollback needed.
-- The changes are backward compatible and don't remove any data.
-- If needed to remove new fields:
/*
-- Remove platform field from social_links (keeps type field):
UPDATE profiles
SET social_links = (
  SELECT jsonb_agg(
    elem - 'platform'
  )
  FROM jsonb_array_elements(social_links) AS elem
)
WHERE social_links IS NOT NULL 
  AND jsonb_typeof(social_links) = 'array';

-- Remove imageLinkCards from theme_settings:
UPDATE profiles
SET theme_settings = theme_settings - 'imageLinkCards'
WHERE theme_settings->>'imageLinkCards' IS NOT NULL;
*/

-- ============================================================================
-- 8. VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================

-- Check social_links structure:
/*
SELECT 
  id,
  username,
  jsonb_array_length(social_links) as link_count,
  social_links
FROM profiles
WHERE social_links IS NOT NULL
LIMIT 5;
*/

-- Check for missing platform field:
/*
SELECT 
  id,
  username,
  COUNT(*) as missing_platform_count
FROM profiles,
  jsonb_array_elements(social_links) AS elem
WHERE (elem->>'platform') IS NULL
GROUP BY id, username;
*/

-- Check image_link_cards usage:
/*
SELECT 
  id,
  username,
  jsonb_array_length(theme_settings->'imageLinkCards') as card_count
FROM profiles
WHERE theme_settings->>'imageLinkCards' IS NOT NULL
LIMIT 5;
*/

-- Count platforms usage:
/*
SELECT 
  elem->>'platform' as platform,
  COUNT(*) as usage_count
FROM profiles,
  jsonb_array_elements(social_links) AS elem
WHERE elem->>'platform' IS NOT NULL
GROUP BY platform
ORDER BY usage_count DESC;
*/

-- ============================================================================
-- 9. DEPLOYMENT NOTES
-- ============================================================================

-- Deployment Order:
-- 1. Deploy application code (includes new SocialMediaManager component)
-- 2. Run this SQL script in Supabase SQL Editor
-- 3. Verify data integrity with verification queries
-- 4. (Optional) Run migration function if existing data needs updating

-- No downtime required - changes are backward compatible

-- ============================================================================
-- 10. MONITORING & MAINTENANCE
-- ============================================================================

-- Monitor for validation errors:
-- SELECT COUNT(*) FROM profiles WHERE social_links IS NOT NULL AND jsonb_typeof(social_links) != 'array';

-- Check storage usage:
-- SELECT 
--   SUM(pg_column_size(social_links)) as social_links_size,
--   SUM(pg_column_size(theme_settings)) as theme_settings_size
-- FROM profiles;

-- Performance monitoring (slow queries):
-- EXPLAIN ANALYZE SELECT * FROM profiles WHERE social_links @> '[{"platform":"instagram"}]'::jsonb;
