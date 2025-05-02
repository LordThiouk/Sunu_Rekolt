-- Add RLS policies for updating order status

-- Policy for Buyers to confirm reception
CREATE POLICY "Allow buyer to confirm reception"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = buyer_id -- User is the buyer
    AND status = 'delivered' -- Can only update if status is 'delivered'
  )
  WITH CHECK (
    status = 'received' -- Can only change the status TO 'received'
  );

-- Policy for Farmers to update delivery status
-- Note: This allows *any* farmer associated with *any* item in the order to update.
-- Might need refinement if only specific farmers should update specific statuses.
CREATE POLICY "Allow farmer to update delivery status"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.order_id = public.orders.id
      AND oi.farmer_id = auth.uid() -- User is a farmer associated with an item in this order
    )
    AND status IN ('paid', 'delivering') -- Can only update if status is 'paid' or 'delivering'
  )
  WITH CHECK (
    status IN ('delivering', 'delivered') -- Can only change status TO 'delivering' or 'delivered'
  );

-- Ensure RLS is enabled (should already be, but safe to include)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
