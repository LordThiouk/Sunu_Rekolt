-- Simplify RLS policies and add functions to avoid recursion

-- 1. Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their relevant orders" ON public.orders;
DROP POLICY IF EXISTS "Farmers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Buyers can view items for their own orders" ON public.order_items;

-- 2. Create simplified SELECT policy for orders (Buyer only)
CREATE POLICY "Buyers can view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- 3. Create simplified SELECT policy for order_items (Farmer only)
CREATE POLICY "Farmers can view their own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

-- 4. Function for Buyers to get items for a specific order
CREATE OR REPLACE FUNCTION get_order_items_for_buyer(p_order_id uuid)
RETURNS SETOF order_items -- Or a custom type/json if needed
LANGUAGE plpgsql
SECURITY DEFINER -- Use with caution, grants elevated privileges for the function's execution
SET search_path = public -- Important for SECURITY DEFINER functions
AS $$
DECLARE
  v_buyer_id uuid;
BEGIN
  -- Verify the caller owns the order first
  SELECT buyer_id INTO v_buyer_id
  FROM orders
  WHERE id = p_order_id;

  IF v_buyer_id != auth.uid() THEN
    RAISE EXCEPTION 'User % does not own order %', auth.uid(), p_order_id;
  END IF;

  -- If ownership is verified, return the items
  RETURN QUERY 
  SELECT * 
  FROM order_items
  WHERE order_id = p_order_id;
END;
$$;

-- 5. Function for Farmers to get received orders (basic details)
-- Note: Needs adjustment if more details or joined product info is required
CREATE OR REPLACE FUNCTION get_received_orders_for_farmer(p_farmer_id uuid)
RETURNS SETOF orders -- Return type matches orders table structure for simplicity
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller matches the requested farmer ID
  IF p_farmer_id != auth.uid() THEN
     RAISE EXCEPTION 'User % cannot request orders for farmer %', auth.uid(), p_farmer_id;
  END IF;

  RETURN QUERY
  SELECT DISTINCT o.*
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE oi.farmer_id = p_farmer_id
  ORDER BY o.created_at DESC;
END;
$$;
