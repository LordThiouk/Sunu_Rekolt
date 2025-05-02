

-- Allow a buyer to select a farmer's phone number if they have placed an order with that farmer

-- First, ensure RLS is enabled (might be redundant but safe)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy Definition
CREATE POLICY "Allow buyer to read farmer phone after order"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      WHERE
        o.buyer_id = auth.uid() -- The current user is the buyer of the order
        AND oi.farmer_id = public.profiles.id -- The profile being selected is the farmer on an item in that order
        -- Optional: Add status checks if phone should only be visible after payment, etc.
        -- AND o.status IN ('paid', 'delivering', 'delivered', 'received')
    )
  );

-- Note: We might need a similar policy for farmers reading buyer phones,
-- or handle that via the SMS Edge Function payload.

-- Also, ensure the existing policy allowing users to read their OWN profile is still present
-- If it was deleted or modified, re-add it:
-- CREATE POLICY "Users can read their own profile"
--   ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- Ensure the policy allowing reading profiles linked via products is still present
-- If deleted/modified, re-add it:
-- CREATE POLICY "Allow reading farmer profiles linked to products"
--   ON public.profiles FOR SELECT TO authenticated USING ( EXISTS ( SELECT 1 FROM public.products p WHERE p.farmer_id = public.profiles.id ) );