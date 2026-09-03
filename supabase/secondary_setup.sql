-- ====================================================================
-- SECONDARY SUPABASE DATABASE SETUP SCRIPT (NRSA ORGANIZATION)
-- Copy and execute this entire script in the SQL Editor of your 
-- NEW / SECONDARY Supabase Project dashboard.
-- ====================================================================

-- 1. Enable UUID Extension & Enums
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    email TEXT,
    passcode TEXT,
    theme TEXT DEFAULT 'amber',
    plan TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    enabled_pages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Festivals Table
CREATE TABLE IF NOT EXISTS public.festivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    theme TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    background_color TEXT,
    background_image TEXT,
    background_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
    enabled_pages JSONB,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_english TEXT,
    amount NUMERIC NOT NULL,
    received_amount NUMERIC,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    donation_mode TEXT DEFAULT 'cash',
    payment_method TEXT DEFAULT 'cash',
    festival_name TEXT,
    festival_year INTEGER,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    type_english TEXT,
    amount NUMERIC NOT NULL,
    description TEXT,
    festival_name TEXT,
    festival_year INTEGER,
    user_id UUID,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Images Table
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    description TEXT,
    festival_name TEXT,
    festival_year INTEGER,
    user_id UUID,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Competitions Table
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    show_results BOOLEAN DEFAULT false,
    layout TEXT DEFAULT 'grid',
    results_date TIMESTAMPTZ,
    vote_limit_per_user INTEGER DEFAULT 1,
    festival_id UUID REFERENCES public.festivals(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    festival_id UUID REFERENCES public.festivals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number TEXT NOT NULL,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. User Profiles & Roles Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT,
    user_id UUID,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Passcode Verification RPC Function
CREATE OR REPLACE FUNCTION public.verify_organization_passcode(_organization_id UUID, _passcode TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    org_passcode TEXT;
BEGIN
    SELECT passcode INTO org_passcode FROM public.organizations WHERE id = _organization_id;
    RETURN org_passcode IS NOT NULL AND org_passcode = _passcode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read organizations" ON public.organizations FOR SELECT USING (true);
    CREATE POLICY "Allow public all organizations" ON public.organizations FOR ALL USING (true);
    CREATE POLICY "Allow public all festivals" ON public.festivals FOR ALL USING (true);
    CREATE POLICY "Allow public all donations" ON public.donations FOR ALL USING (true);
    CREATE POLICY "Allow public all expenses" ON public.expenses FOR ALL USING (true);
    CREATE POLICY "Allow public all images" ON public.images FOR ALL USING (true);
    CREATE POLICY "Allow public all competitions" ON public.competitions FOR ALL USING (true);
    CREATE POLICY "Allow public all participants" ON public.participants FOR ALL USING (true);
    CREATE POLICY "Allow public all votes" ON public.votes FOR ALL USING (true);
    CREATE POLICY "Allow public all activity_logs" ON public.activity_logs FOR ALL USING (true);
    CREATE POLICY "Allow public all settings" ON public.settings FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 15. Create Storage Bucket for User Images
INSERT INTO storage.buckets (id, name, public) VALUES ('user-images', 'user-images', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    CREATE POLICY "Allow public storage access" ON storage.objects FOR ALL USING (bucket_id = 'user-images');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 16. Pre-seed the NRSA Organization Record
INSERT INTO public.organizations (name, slug, description)
VALUES ('NRSA', 'nrsa', 'NRSA Dedicated Organization Database')
ON CONFLICT (slug) DO NOTHING;
