-- Allow authenticated users to read profile data (needed for joins like products->farmer name)
CREATE POLICY "Allow authenticated users to read profile data"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
