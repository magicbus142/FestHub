-- Allow anyone to update background_image_id on festivals
CREATE POLICY "Anyone can update festival background image" 
ON public.festivals 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Drop the restrictive update policy
DROP POLICY "Authenticated users can update festivals" ON public.festivals;