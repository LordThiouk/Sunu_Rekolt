-- Restore essential RLS policies and fix function ambiguity

-- 1. Drop temporary policies (if they somehow still exist)
DROP POLICY IF EXISTS "TEMP - Allow authenticated read all orders" ON public.orders;
DROP POLICY IF EXISTS "TEMP - Allow authenticated read all order items" ON public.order_items;

-- 2. Restore essential INSERT policies
CREATE POLICY "Authenticated users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can insert items for their own orders"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE id = order_items.order_id AND buyer_id = auth.uid()
    )
  );
  
-- 3. Restore simplified SELECT policies
CREATE POLICY "Buyers can view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());
  
CREATE POLICY "Farmers can view their own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

-- 4. Fix function get_order_items_for_buyer (Explicit column list)
-- Drop the existing function first
DROP FUNCTION IF EXISTS get_order_items_for_buyer(uuid);

CREATE OR REPLACE FUNCTION get_order_items_for_buyer(p_order_id uuid)
RETURNS TABLE (
    item_id uuid, -- Alias oi.id
    order_id uuid,
    product_id uuid,
    farmer_id uuid,
    quantity integer,
    price_at_time decimal,
    created_at timestamptz,
    product_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid;
BEGIN
  -- Verify the caller owns the order first
  SELECT o.buyer_id INTO v_buyer_id
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_buyer_id != auth.uid() THEN
    RAISE EXCEPTION 'User % does not own order %', auth.uid(), p_order_id;
  END IF;

  -- Return items with explicit columns and alias for oi.id
  RETURN QUERY 
  SELECT 
    oi.id AS item_id, -- Explicitly select and alias oi.id
    oi.order_id,
    oi.product_id,
    oi.farmer_id,
    oi.quantity,
    oi.price_at_time,
    oi.created_at,
    p.name AS product_name
  FROM 
    public.order_items oi
  LEFT JOIN 
    public.products p ON oi.product_id = p.id
  WHERE 
    oi.order_id = p_order_id;
END;
$$;
