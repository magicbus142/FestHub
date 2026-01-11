-- Ensure 'expenses' is included in enabled_pages for all festivals
-- This fixes the issue where the Expenses tab might be hidden by default
UPDATE festivals 
SET enabled_pages = enabled_pages || '["expenses"]'::jsonb 
WHERE enabled_pages IS NOT NULL 
AND NOT (enabled_pages @> '["expenses"]'::jsonb);
