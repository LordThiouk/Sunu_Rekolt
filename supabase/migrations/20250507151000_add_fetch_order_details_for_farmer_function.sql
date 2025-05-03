-- Function for farmer to get details of an order they are involved in, including buyer info.
-- Uses SECURITY DEFINER to bypass potential RLS recursion, but includes manual auth checks.

CREATE OR REPLACE FUNCTION get_order_details_for_farmer(p_order_id uuid)
RETURNS json -- Return as JSON for flexibility
LANGUAGE plpgsql
SECURITY DEFINER
-- IMPORTANT: Set a safe search_path
SET search_path = public
AS $$
DECLARE
  v_order_details record;
  v_buyer_details record;
  v_is_farmer_involved boolean := false;
  v_result json;
BEGIN
  -- 1. Authorization Check: Verify the calling user (farmer) is linked to this order via order_items
  SELECT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.farmer_id = auth.uid()
  ) INTO v_is_farmer_involved;

  IF NOT v_is_farmer_involved THEN
    RAISE EXCEPTION 'Authorization Error: Farmer % is not involved in order %', auth.uid(), p_order_id;
  END IF;

  -- 2. Fetch Order Details (bypassing RLS due to SECURITY DEFINER)
  SELECT * INTO v_order_details
  FROM orders
  WHERE id = p_order_id;

  IF v_order_details IS NULL THEN
     RAISE EXCEPTION 'Order Not Found: Order % does not exist.', p_order_id;
  END IF;

  -- 3. Fetch Buyer Profile Details (bypassing RLS due to SECURITY DEFINER)
  SELECT id, name, phone INTO v_buyer_details
  FROM profiles
  WHERE id = v_order_details.buyer_id;
  
   IF v_buyer_details IS NULL THEN
     -- This case should ideally not happen if foreign keys are set up,
     -- but handle it defensively. Could return null for buyer or raise error.
     RAISE EXCEPTION 'Buyer Profile Not Found: Profile for buyer ID % not found.', v_order_details.buyer_id;
  END IF;

  -- 4. Construct JSON response (map snake_case to camelCase where needed by frontend types)
  v_result := json_build_object(
    'id', v_order_details.id,
    'buyerId', v_order_details.buyer_id,
    'total', v_order_details.total,
    'status', v_order_details.status,
    'paymentMethod', v_order_details.payment_method,
    'createdAt', v_order_details.created_at,
    'delivery_address', v_order_details.delivery_address, -- Keep snake_case as per Order type
    'delivery_details', v_order_details.delivery_details, -- Keep snake_case as per Order type
    'buyer', json_build_object(
        'id', v_buyer_details.id,
        'name', v_buyer_details.name,
        'phone', v_buyer_details.phone
     )
  );

  RETURN v_result;
END;
$$; 