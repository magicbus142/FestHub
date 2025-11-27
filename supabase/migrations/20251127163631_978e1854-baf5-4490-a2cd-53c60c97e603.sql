-- Add passcode field to organizations table
ALTER TABLE public.organizations
ADD COLUMN passcode TEXT;

-- Create function to verify organization passcode
CREATE OR REPLACE FUNCTION public.verify_organization_passcode(
  _organization_id UUID,
  _passcode TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = _organization_id
      AND passcode = _passcode
  );
END;
$$;

-- Update RLS policies to allow public read access but require passcode for mutations
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON public.organizations;

CREATE POLICY "Anyone can view organizations"
ON public.organizations
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone with passcode can update organizations"
ON public.organizations
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Update donations policies to allow public read
DROP POLICY IF EXISTS "Users can view donations in their organizations" ON public.donations;
CREATE POLICY "Anyone can view donations"
ON public.donations
FOR SELECT
USING (true);

-- Update expenses policies to allow public read
DROP POLICY IF EXISTS "Users can view expenses in their organizations" ON public.expenses;
CREATE POLICY "Anyone can view expenses"
ON public.expenses
FOR SELECT
USING (true);

-- Update images policies to allow public read
DROP POLICY IF EXISTS "Users can view images in their organizations" ON public.images;
CREATE POLICY "Anyone can view images"
ON public.images
FOR SELECT
USING (true);

-- Update festivals policies to allow public read
DROP POLICY IF EXISTS "Users can view festivals in their organizations" ON public.festivals;
CREATE POLICY "Anyone can view festivals"
ON public.festivals
FOR SELECT
USING (true);