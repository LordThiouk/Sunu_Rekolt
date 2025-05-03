-- Temporarily REMOVE ALL RLS policies from orders and order_items for debugging

-- Drop orders policies
DROP POLICY IF EXISTS "Buyers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their relevant orders" ON public.orders;
-- Also drop INSERT/UPDATE/DELETE if they exist (adjust names if needed)
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can update delivered orders to received" ON public.orders;
DROP POLICY IF EXISTS "Farmers can update paid/delivering orders" ON public.orders;


-- Drop order_items policies
DROP POLICY IF EXISTS "Farmers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Buyers can view items for their own orders" ON public.order_items;
-- Also drop INSERT if it exists (adjust name if needed)
DROP POLICY IF EXISTS "Buyers can insert items for their own orders" ON public.order_items;


-- Disable RLS entirely on these tables (USE WITH EXTREME CAUTION)
-- ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- NOTE: RLS is just having policies dropped, not disabled. 
-- This means NO access will be granted by default if RLS is still enabled.
-- If the intention is truly open access for testing, UNCOMMENT the DISABLE lines above.
-- However, it's often better to test with RLS enabled but NO policies, 
-- which should DENY access, proving the policies were the issue if operations fail.
-- If operations SUCCEED with RLS enabled but no policies, something else is wrong.
