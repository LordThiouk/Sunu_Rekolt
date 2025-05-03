-- Remove the recursive RLS policy from the orders table

-- This policy caused infinite recursion when fetching orders
DROP POLICY IF EXISTS "Farmers can view orders they are involved in" ON public.orders;

-- Note: The policy allowing buyers to view their own orders remains.
-- The policy allowing farmers to view their own order_items remains.
-- Authorization check for farmers viewing specific order details is now handled in application code. 