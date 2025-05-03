-- Temporarily grant broad SELECT permissions for debugging RLS issues

-- 1. Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their relevant orders" ON public.orders;
DROP POLICY IF EXISTS "Farmers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Buyers can view items for their own orders" ON public.order_items;

-- 2. Grant broad SELECT access to authenticated users

CREATE POLICY "TEMP - Allow authenticated read all orders" 
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (true);
  
CREATE POLICY "TEMP - Allow authenticated read all order items" 
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (true);

-- NOTE: Remember to revert these broad policies later and apply secure ones!
