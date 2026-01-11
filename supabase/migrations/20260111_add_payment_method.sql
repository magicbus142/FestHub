-- Add payment_method column to donations table
ALTER TABLE donations ADD COLUMN payment_method text DEFAULT 'cash';
