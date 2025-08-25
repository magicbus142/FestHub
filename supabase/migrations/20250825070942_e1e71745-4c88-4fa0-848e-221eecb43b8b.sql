
-- Remove RLS policies that require authentication for expenses table
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

-- Create new policies that allow all operations for everyone
CREATE POLICY "Allow all operations on expenses" 
  ON public.expenses 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Remove RLS policies that require authentication for images table
DROP POLICY IF EXISTS "Users can view their own images" ON public.images;
DROP POLICY IF EXISTS "Users can create their own images" ON public.images;
DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;

-- Create new policies that allow all operations for everyone
CREATE POLICY "Allow all operations on images" 
  ON public.images 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Update storage bucket policy to allow public access
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create public storage policies for user-images bucket
CREATE POLICY "Allow public uploads to user-images bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-images');

CREATE POLICY "Allow public viewing of user-images bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-images');

CREATE POLICY "Allow public deletion from user-images bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-images');
