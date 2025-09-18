-- Add background_image_id field to festivals table to track pinned images
ALTER TABLE public.festivals 
ADD COLUMN background_image_id uuid REFERENCES public.images(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_festivals_background_image_id ON public.festivals(background_image_id);