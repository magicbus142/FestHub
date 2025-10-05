-- Update RLS policies for expenses table to only allow authenticated users to modify data

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;

-- Allow anyone to view expenses
CREATE POLICY "Anyone can view expenses"
ON public.expenses
FOR SELECT
USING (true);

-- Only authenticated users can insert their own expenses
CREATE POLICY "Authenticated users can insert expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own expenses
CREATE POLICY "Authenticated users can update own expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can delete their own expenses
CREATE POLICY "Authenticated users can delete own expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);