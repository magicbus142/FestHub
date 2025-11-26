-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'viewer');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, organization_id)
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create organization invitations table
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add organization_id to existing tables
ALTER TABLE public.donations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.festivals ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.images ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON public.user_roles(organization_id);
CREATE INDEX idx_donations_organization_id ON public.donations(organization_id);
CREATE INDEX idx_expenses_organization_id ON public.expenses(organization_id);
CREATE INDEX idx_festivals_organization_id ON public.festivals(organization_id);
CREATE INDEX idx_images_organization_id ON public.images(organization_id);
CREATE INDEX idx_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_invitations_email ON public.organization_invitations(email);

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _organization_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id UUID, _organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _organization_id
  )
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.organization_id = organizations.id
        AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their organizations"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), id, 'admin'))
  WITH CHECK (public.has_role(auth.uid(), id, 'admin'));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their organizations"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_organization_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'admin'))
  WITH CHECK (public.has_role(auth.uid(), organization_id, 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for organization_invitations
CREATE POLICY "Users can view invitations in their organizations"
  ON public.organization_invitations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Admins and managers can create invitations"
  ON public.organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Admins and managers can update invitations"
  ON public.organization_invitations FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

-- Update RLS policies for existing tables to be organization-scoped
-- Donations
DROP POLICY IF EXISTS "Allow all operations on donations" ON public.donations;
CREATE POLICY "Users can view donations in their organizations"
  ON public.donations FOR SELECT
  TO authenticated
  USING (public.is_organization_member(auth.uid(), organization_id));

CREATE POLICY "Managers and admins can insert donations"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can update donations"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can delete donations"
  ON public.donations FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

-- Expenses
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update own expenses" ON public.expenses;

CREATE POLICY "Users can view expenses in their organizations"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (public.is_organization_member(auth.uid(), organization_id));

CREATE POLICY "Managers and admins can insert expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

-- Festivals
DROP POLICY IF EXISTS "Anyone can view festivals" ON public.festivals;
DROP POLICY IF EXISTS "Anyone can update festival background image" ON public.festivals;
DROP POLICY IF EXISTS "Authenticated users can create festivals" ON public.festivals;
DROP POLICY IF EXISTS "Authenticated users can delete festivals" ON public.festivals;

CREATE POLICY "Users can view festivals in their organizations"
  ON public.festivals FOR SELECT
  TO authenticated
  USING (public.is_organization_member(auth.uid(), organization_id));

CREATE POLICY "Managers and admins can insert festivals"
  ON public.festivals FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can update festivals"
  ON public.festivals FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can delete festivals"
  ON public.festivals FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

-- Images
DROP POLICY IF EXISTS "Allow all operations on images" ON public.images;

CREATE POLICY "Users can view images in their organizations"
  ON public.images FOR SELECT
  TO authenticated
  USING (public.is_organization_member(auth.uid(), organization_id));

CREATE POLICY "Managers and admins can insert images"
  ON public.images FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can update images"
  ON public.images FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

CREATE POLICY "Managers and admins can delete images"
  ON public.images FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), organization_id, 'admin') OR
    public.has_role(auth.uid(), organization_id, 'manager')
  );

-- Trigger to update updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();