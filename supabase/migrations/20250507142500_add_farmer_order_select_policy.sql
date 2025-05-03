-- Allow farmers to select orders where they have items

-- Drop the existing buyer-only policy first if you want to replace it,
-- or just add this one if buyers should also retain their access.
-- Let's keep the buyer policy for now and just add the farmer one.
-- DROP POLICY IF EXISTS "Buyers can view their own orders" ON public.orders;

CREATE POLICY "Farmers can view orders they are involved in"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    -- Check if an order_item exists linking this order to the current farmer
    EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = orders.id
        AND oi.farmer_id = auth.uid()
    )
  );

-- Optional: If you want to combine buyer and farmer access into one policy:
/*
DROP POLICY IF EXISTS "Buyers can view their own orders" ON public.orders;

CREATE POLICY "Users can view orders they are involved in (buyer or farmer)"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    -- User is the buyer
    buyer_id = auth.uid()
    -- OR User is a farmer associated with an item in this order
    OR EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = orders.id
        AND oi.farmer_id = auth.uid()
    )
  );
*/ 