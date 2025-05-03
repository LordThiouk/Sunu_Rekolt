-- Add SELECT policy for buyers on order_items table

CREATE POLICY "Buyers can view items for their own orders"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    -- Check if the order being referenced exists and belongs to the current user
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE id = order_items.order_id AND buyer_id = auth.uid()
    )
  );
