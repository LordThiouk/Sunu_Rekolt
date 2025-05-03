-- Allow farmers to read profiles of buyers who ordered their products

CREATE POLICY "Farmers can read buyer profiles for their orders"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Check if the profile being read belongs to a buyer who placed an order
    -- containing an item from the currently logged-in farmer.
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      WHERE 
        o.buyer_id = profiles.id -- Link the profile being read to the order's buyer
        AND oi.farmer_id = auth.uid() -- Ensure the order contains an item from this farmer
    )
  );
