-- Add delivery address columns to the orders table

ALTER TABLE public.orders
ADD COLUMN delivery_address text,
ADD COLUMN delivery_details text;

-- Optional: Add a check constraint if address becomes mandatory later
-- ALTER TABLE public.orders
-- ALTER COLUMN delivery_address SET NOT NULL;
