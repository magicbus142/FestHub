-- Create database functions for calculating totals
CREATE OR REPLACE FUNCTION get_total_amount()
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM donations), 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_total_by_category(category_param TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM donations WHERE category = category_param), 0);
END;
$$ LANGUAGE plpgsql;