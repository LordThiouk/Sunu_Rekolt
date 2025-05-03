-- Fix RLS recursion between orders and order_items

-- 1. Drop existing potentially problematic SELECT policies
DROP POLICY IF EXISTS "Users can read their own orders" ON public.orders;
DROP POLICY IF EXISTS "Farmers can view orders containing their items" ON public.orders;
DROP POLICY IF EXISTS "Users can view relevant order items" ON public.order_items;
DROP POLICY IF EXISTS "Farmers can view their own order items" ON public.order_items; -- Just in case old one persists
DROP POLICY IF EXISTS "Buyers can view items for their own orders" ON public.order_items; -- Just in case old one persists

-- 2. Create revised SELECT policy for orders table
CREATE POLICY "Users can view their relevant orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    -- Allow buyer to see their own order
    (buyer_id = auth.uid())
    OR
    -- Allow farmer to see orders containing their items
    EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = orders.id AND oi.farmer_id = auth.uid()
    )
  );

-- 3. Create revised SELECT policies for order_items table (Separated)

-- Policy A: Farmers can see their items
CREATE POLICY "Farmers can view their own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

-- Policy B: Buyers can see items from their orders
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
