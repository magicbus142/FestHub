-- Add festival_id to competitions table
ALTER TABLE public.competitions
ADD COLUMN festival_id UUID REFERENCES public.festivals(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_competitions_festival_id ON public.competitions(festival_id);

-- Add comment
COMMENT ON COLUMN public.competitions.festival_id IS 'The festival this competition belongs to. Allows filtering competitions by festival.';
