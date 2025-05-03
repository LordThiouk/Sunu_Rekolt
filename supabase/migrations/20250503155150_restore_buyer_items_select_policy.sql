-- Restore secure buyer SELECT policy for order_items

-- Drop the temporary policy
DROP POLICY IF EXISTS "TEMP - Buyers can view ALL items" ON public.order_items;

-- Re-create the secure policy using EXISTS check
CREATE POLICY "Buyers can view items for their own orders"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid()
    )
  );
