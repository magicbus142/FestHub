-- Create festivals table
CREATE TABLE public.festivals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  background_color TEXT,
  background_image TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;

-- Create policies for festivals (public read, authenticated write)
CREATE POLICY "Anyone can view festivals" 
ON public.festivals 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create festivals" 
ON public.festivals 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update festivals" 
ON public.festivals 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete festivals" 
ON public.festivals 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_festivals_updated_at
BEFORE UPDATE ON public.festivals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default festivals
INSERT INTO public.festivals (name, year, background_color, description, is_active) VALUES 
('Ganesh', 2025, 'hsl(var(--festival-orange))', 'Ganesh Chaturthi Festival 2025', true),
('Dashara', 2025, 'hsl(var(--festival-gold))', 'Dashara Festival 2025', true);