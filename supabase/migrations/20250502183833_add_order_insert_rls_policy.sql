CREATE POLICY "Allow authenticated users to insert their own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);
