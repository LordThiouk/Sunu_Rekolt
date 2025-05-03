-- Modify function for Buyers to get items for a specific order, including product name

-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS get_order_items_for_buyer(uuid);

CREATE OR REPLACE FUNCTION get_order_items_for_buyer(p_order_id uuid)
-- Specify exact columns to return, including from the join
RETURNS TABLE (
    id uuid,
    order_id uuid,
    product_id uuid,
    farmer_id uuid,
    quantity integer,
    price_at_time decimal,
    created_at timestamptz,
    product_name text -- Add product name
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid;
BEGIN
  -- Verify the caller owns the order first
  SELECT buyer_id INTO v_buyer_id
  FROM public.orders -- Qualify table name
  WHERE public.orders.id = p_order_id; -- Fully qualify orders.id

  IF v_buyer_id != auth.uid() THEN
    RAISE EXCEPTION 'User % does not own order %', auth.uid(), p_order_id;
  END IF;

  -- If ownership is verified, return the items with product name
  RETURN QUERY 
  SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.farmer_id,
    oi.quantity,
    oi.price_at_time,
    oi.created_at,
    p.name AS product_name -- Select product name
  FROM 
    public.order_items oi -- Qualify table name
  LEFT JOIN 
    public.products p ON oi.product_id = p.id -- Qualify table name
  WHERE 
    oi.order_id = p_order_id;
END;
$$;
