-- ========================================
-- DIAGNOSTIC: Check what columns exist NOW
-- ========================================
-- Run this first to see current table structure

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'followers' 
ORDER BY ordinal_position;
