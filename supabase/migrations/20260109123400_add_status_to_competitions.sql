-- Add status column to competitions table
ALTER TABLE public.competitions ADD COLUMN status TEXT DEFAULT 'live' CHECK (status IN ('live', 'closed'));
