-- Drop the temporary broad SELECT policies
DROP POLICY IF EXISTS "TEMP - Allow authenticated read all orders" ON public.orders;
DROP POLICY IF EXISTS "TEMP - Allow authenticated read all order items" ON public.order_items;

-- Re-apply the secure, non-recursive policies from 20250503150701_fix_rls_recursion.sql

-- Policy for orders
CREATE POLICY "Users can view their relevant orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    (buyer_id = auth.uid())
    OR
    EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = orders.id AND oi.farmer_id = auth.uid()
    )
  );

-- Policies for order_items
CREATE POLICY "Farmers can view their own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

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
