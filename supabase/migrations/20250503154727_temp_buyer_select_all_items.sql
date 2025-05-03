-- Temporarily modify buyer's SELECT policy on order_items for debugging

-- Drop the existing policy first
DROP POLICY IF EXISTS "Buyers can view items for their own orders" ON public.order_items;

-- Create a temporary, insecure policy allowing buyers to see ALL items
CREATE POLICY "TEMP - Buyers can view ALL items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (true); -- Insecure: Allows any authenticated user to read all items

-- NOTE: This is insecure and for debugging only. Must be reverted.
