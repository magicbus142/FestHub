-- Add email column to organizations
ALTER TABLE public.organizations ADD COLUMN email TEXT;

-- Create passcode_reset_tokens table
CREATE TABLE public.passcode_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.passcode_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Set email for Ganesh Temple 2025
UPDATE public.organizations 
SET email = 'swamirangareddy2@gmail.com' 
WHERE name ILIKE 'Ganesh Temple 2025';

-- Helper function to request passcode reset
CREATE OR REPLACE FUNCTION public.request_passcode_reset(_org_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _org_id UUID;
  _org_email TEXT;
  _token TEXT;
BEGIN
  -- Find org
  SELECT id, email INTO _org_id, _org_email
  FROM public.organizations
  WHERE name ILIKE _org_name;

  IF _org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Organization not found');
  END IF;

  IF _org_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Organization has no email configured');
  END IF;

  -- Generate token
  _token := encode(gen_random_bytes(32), 'hex');

  -- Store token (valid for 1 hour)
  INSERT INTO public.passcode_reset_tokens (organization_id, token, expires_at)
  VALUES (_org_id, _token, now() + interval '1 hour');

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Reset token generated', 
    'token', _token,
    'email', _org_email
  );
END;
$$;

-- Helper function to reset passcode with token
CREATE OR REPLACE FUNCTION public.reset_organization_passcode(_token TEXT, _new_passcode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _org_id UUID;
BEGIN
  -- Verify token
  SELECT organization_id INTO _org_id
  FROM public.passcode_reset_tokens
  WHERE token = _token AND expires_at > now();

  IF _org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired token');
  END IF;

  -- Update passcode
  UPDATE public.organizations
  SET passcode = _new_passcode
  WHERE id = _org_id;

  -- Delete used token
  DELETE FROM public.passcode_reset_tokens WHERE token = _token;

  RETURN jsonb_build_object('success', true, 'message', 'Passcode reset successfully');
END;
$$;
