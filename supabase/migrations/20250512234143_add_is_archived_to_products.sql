-- Add is_archived column to products table

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.products.is_archived IS 'Indicates if the product has been archived (hidden from catalogue) by the farmer.';
