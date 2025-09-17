-- Add festival_name and year to existing tables for easier filtering
ALTER TABLE donations 
ADD COLUMN festival_name TEXT,
ADD COLUMN festival_year INTEGER;

ALTER TABLE expenses 
ADD COLUMN festival_name TEXT,
ADD COLUMN festival_year INTEGER;

ALTER TABLE images 
ADD COLUMN festival_name TEXT,
ADD COLUMN festival_year INTEGER;

-- Create indexes for better performance on festival filtering
CREATE INDEX idx_donations_festival ON donations(festival_name, festival_year);
CREATE INDEX idx_expenses_festival ON expenses(festival_name, festival_year);
CREATE INDEX idx_images_festival ON images(festival_name, festival_year);