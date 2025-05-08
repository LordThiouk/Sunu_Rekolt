-- Enable RLS on order_items if not already enabled (good practice)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy to prevent ordering own products
DROP POLICY IF EXISTS "Prevent ordering own products" ON public.order_items;

CREATE POLICY "Prevent ordering own products"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
    (
        SELECT p.farmer_id
        FROM public.products p
        WHERE p.id = product_id -- 'product_id' is a column in order_items
    ) <> auth.uid()
);

-- Enable RLS on products if not already enabled (good practice)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Product Visibility Policies
-- Drop existing general SELECT policies to avoid conflicts and ensure clarity.
-- Note: Identify and drop any other specific general read policies if they exist by their name.
DROP POLICY IF EXISTS "Allow public read access for products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view approved products" ON public.products;
DROP POLICY IF EXISTS "Product Visibility Policy V2" ON public.products; -- Example name
DROP POLICY IF EXISTS "Farmers can view their own products" ON public.products;
DROP POLICY IF EXISTS "Buyers can view all approved products" ON public.products;
DROP POLICY IF EXISTS "Farmers can view other approved products in catalogue" ON public.products;


-- Policy 1: Farmers can always view their own products.
-- This is for the "My Products" section of the app for a farmer.
CREATE POLICY "Farmers can view their own products"
ON public.products
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'farmer' AND
    farmer_id = auth.uid()
);

-- Policy 2: Buyers can view all approved products.
-- This covers buyers viewing the catalogue.
CREATE POLICY "Buyers can view all approved products"
ON public.products
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'farmer' AND
    is_approved = true
);

-- Policy 3: Farmers can view approved products from other farmers in catalogue.
-- Frontend is assumed to filter out farmer's own products from THEIR general catalogue view
-- using a query like `AND farmer_id <> auth.uid()`
CREATE POLICY "Farmers can view other approved products in catalogue"
ON public.products
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'farmer' AND
    farmer_id <> auth.uid() AND
    is_approved = true
);
