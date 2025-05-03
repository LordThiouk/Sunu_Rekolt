-- Remove the redundant items jsonb column from the orders table
ALTER TABLE public.orders
DROP COLUMN IF EXISTS items;
