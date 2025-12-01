-- Drop existing restrictive policies for festivals
DROP POLICY IF EXISTS "Managers and admins can insert festivals" ON public.festivals;
DROP POLICY IF EXISTS "Managers and admins can update festivals" ON public.festivals;
DROP POLICY IF EXISTS "Managers and admins can delete festivals" ON public.festivals;

-- Create new policies that allow operations (app handles auth with passcodes)
CREATE POLICY "Anyone can insert festivals"
ON public.festivals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update festivals"
ON public.festivals
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete festivals"
ON public.festivals
FOR DELETE
USING (true);

-- Update donations policies
DROP POLICY IF EXISTS "Managers and admins can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Managers and admins can update donations" ON public.donations;
DROP POLICY IF EXISTS "Managers and admins can delete donations" ON public.donations;

CREATE POLICY "Anyone can insert donations"
ON public.donations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update donations"
ON public.donations
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete donations"
ON public.donations
FOR DELETE
USING (true);

-- Update expenses policies
DROP POLICY IF EXISTS "Managers and admins can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Managers and admins can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Managers and admins can delete expenses" ON public.expenses;

CREATE POLICY "Anyone can insert expenses"
ON public.expenses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update expenses"
ON public.expenses
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete expenses"
ON public.expenses
FOR DELETE
USING (true);

-- Update images policies
DROP POLICY IF EXISTS "Managers and admins can insert images" ON public.images;
DROP POLICY IF EXISTS "Managers and admins can update images" ON public.images;
DROP POLICY IF EXISTS "Managers and admins can delete images" ON public.images;

CREATE POLICY "Anyone can insert images"
ON public.images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update images"
ON public.images
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete images"
ON public.images
FOR DELETE
USING (true);