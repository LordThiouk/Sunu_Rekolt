-- 1. Allow public read access to all files in the 'product-images' bucket.
-- Images are typically public once linked from an approved product.
-- Path: products/:farmer_id/:fileName
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Allow authenticated users with the role 'farmer' to upload to their own folder.
-- Path: products/:farmer_id/:fileName
-- The folder name at index 2 (1-indexed) of the path `products/:farmer_id/` should match the uploader's UID.
CREATE POLICY "Allow farmers to upload to their product image folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (select role from public.profiles where id = auth.uid()) = 'farmer' -- Checks the user's role from your profiles table
  AND (string_to_array(name, '/'))[1] = 'products' -- Ensures it's in the 'products' top-level folder
  AND (string_to_array(name, '/'))[2] = auth.uid()::text -- Ensures farmer uploads to their own folder
);

-- 3. Allow farmers to update images within their own folder.
-- Path: products/:farmer_id/:fileName
CREATE POLICY "Allow farmers to update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( -- USING clause for existing objects
  bucket_id = 'product-images'
  AND (select role from public.profiles where id = auth.uid()) = 'farmer'
  AND (string_to_array(name, '/'))[1] = 'products'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
)
WITH CHECK ( -- WITH CHECK clause for the new/updated object state
  bucket_id = 'product-images'
  AND (select role from public.profiles where id = auth.uid()) = 'farmer'
  AND (string_to_array(name, '/'))[1] = 'products'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
);

-- 4. Allow farmers to delete images from their own folder.
-- Path: products/:farmer_id/:fileName
CREATE POLICY "Allow farmers to delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (select role from public.profiles where id = auth.uid()) = 'farmer'
  AND (string_to_array(name, '/'))[1] = 'products'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
);
