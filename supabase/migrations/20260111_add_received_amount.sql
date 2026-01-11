-- Add received_amount column to donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS received_amount NUMERIC DEFAULT 0;
