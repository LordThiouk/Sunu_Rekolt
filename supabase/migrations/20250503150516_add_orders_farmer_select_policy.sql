-- Add SELECT policy for farmers on orders table based on items

CREATE POLICY "Farmers can view orders containing their items"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    -- Allow access if the order contains an item linked to the current user (farmer)
    EXISTS (
      SELECT 1
      FROM public.order_items
      WHERE order_items.order_id = orders.id AND order_items.farmer_id = auth.uid()
    )
  );
