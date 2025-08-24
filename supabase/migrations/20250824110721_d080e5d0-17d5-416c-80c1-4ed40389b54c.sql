-- Fix security warnings: Add search_path parameter to functions
DROP FUNCTION IF EXISTS get_total_amount();
DROP FUNCTION IF EXISTS get_total_by_category(TEXT);

CREATE OR REPLACE FUNCTION get_total_amount()
RETURNS NUMERIC 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM donations), 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_total_by_category(category_param TEXT)
RETURNS NUMERIC 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM donations WHERE category = category_param), 0);
END;
$$;