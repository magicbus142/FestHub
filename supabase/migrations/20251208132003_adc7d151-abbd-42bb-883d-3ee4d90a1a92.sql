-- Add theme and enabled_pages columns to organizations table
ALTER TABLE public.organizations
ADD COLUMN theme text DEFAULT 'classic',
ADD COLUMN enabled_pages jsonb DEFAULT '["dashboard", "chandas", "expenses", "images", "organizers"]'::jsonb;

-- Add theme and enabled_pages columns to festivals table (can override organization settings)
ALTER TABLE public.festivals
ADD COLUMN theme text DEFAULT NULL,
ADD COLUMN enabled_pages jsonb DEFAULT NULL;

-- Add comment to explain theme options
COMMENT ON COLUMN public.organizations.theme IS 'Theme options: classic, modern, festive, elegant';
COMMENT ON COLUMN public.organizations.enabled_pages IS 'Array of enabled page names: dashboard, chandas, expenses, images, organizers';
COMMENT ON COLUMN public.festivals.theme IS 'Override organization theme for this festival. NULL means use organization theme';
COMMENT ON COLUMN public.festivals.enabled_pages IS 'Override organization pages for this festival. NULL means use organization settings';