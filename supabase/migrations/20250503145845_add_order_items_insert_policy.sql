-- Add INSERT policy for order_items table

CREATE POLICY "Buyers can insert items for their own orders"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if the order being referenced exists and belongs to the current user
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE id = order_items.order_id AND buyer_id = auth.uid()
    )
  );
