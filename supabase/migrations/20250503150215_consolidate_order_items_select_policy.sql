-- Drop existing SELECT policies for order_items
DROP POLICY IF EXISTS "Farmers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Buyers can view items for their own orders" ON public.order_items;

-- Create a consolidated SELECT policy for order_items
CREATE POLICY "Users can view relevant order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    -- Allow access if the user is the farmer linked to the item
    (farmer_id = auth.uid())
    OR
    -- Allow access if the user is the buyer of the order linked to the item
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE id = order_items.order_id AND buyer_id = auth.uid()
    )
  );
