-- Add donation_mode column to track Cash vs Goods vs Service
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS donation_mode TEXT DEFAULT 'cash';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_donations_mode ON donations(donation_mode);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
