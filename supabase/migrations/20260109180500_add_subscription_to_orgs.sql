-- Add plan and subscription_status columns to organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Add comment to explain plan types
COMMENT ON COLUMN public.organizations.plan IS 'Possible values: free, pro_monthly, pro_annual';
COMMENT ON COLUMN public.organizations.subscription_status IS 'Possible values: active, canceled, past_due';
