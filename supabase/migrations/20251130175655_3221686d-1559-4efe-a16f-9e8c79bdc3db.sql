-- Insert default organization if it doesn't exist
INSERT INTO public.organizations (name, slug, description, passcode)
VALUES (
  'Ganesh Temple 2025',
  'ganesh-2025',
  'Default organization for existing data',
  'ganesh@2025kpl'
)
ON CONFLICT (slug) DO NOTHING;

-- Update all festivals without organization to use default
UPDATE public.festivals
SET organization_id = (
  SELECT id FROM public.organizations WHERE slug = 'ganesh-2025' LIMIT 1
)
WHERE organization_id IS NULL;

-- Update all donations without organization to use default
UPDATE public.donations
SET organization_id = (
  SELECT id FROM public.organizations WHERE slug = 'ganesh-2025' LIMIT 1
)
WHERE organization_id IS NULL;

-- Update all expenses without organization to use default
UPDATE public.expenses
SET organization_id = (
  SELECT id FROM public.organizations WHERE slug = 'ganesh-2025' LIMIT 1
)
WHERE organization_id IS NULL;

-- Update all images without organization to use default
UPDATE public.images
SET organization_id = (
  SELECT id FROM public.organizations WHERE slug = 'ganesh-2025' LIMIT 1
)
WHERE organization_id IS NULL;