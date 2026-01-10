-- Add festival_id to participants table
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES public.festivals(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_participants_festival_id ON public.participants(festival_id);

-- Add comment
COMMENT ON COLUMN public.participants.festival_id IS 'Link to the festival this participant belongs to (redundant but requested for easier querying)';

-- Backfill Script for existing data
DO $$ 
DECLARE 
  found_org_id UUID;
  found_fest_id UUID;
BEGIN
  -- 1. Identify IDs
  SELECT id INTO found_org_id FROM public.organizations LIMIT 1;
  SELECT id INTO found_fest_id FROM public.festivals WHERE name ILIKE '%new year%' LIMIT 1;
  
  -- Fallback if 'new year' name check fails
  IF found_fest_id IS NULL THEN
     SELECT id INTO found_fest_id FROM public.festivals LIMIT 1;
  END IF;

  IF found_org_id IS NOT NULL AND found_fest_id IS NOT NULL THEN
     -- 2. Update Competitions (Ensure they are linked)
     UPDATE public.competitions 
     SET organization_id = found_org_id, 
         festival_id = found_fest_id;
     
     -- 3. Update Participants (Link to the same festival)
     UPDATE public.participants
     SET festival_id = found_fest_id;
     
     RAISE NOTICE 'SUCCESS: Backfilled Competitions and Participants for Org: % and Fest: %', found_org_id, found_fest_id;
  END IF;
END $$;
