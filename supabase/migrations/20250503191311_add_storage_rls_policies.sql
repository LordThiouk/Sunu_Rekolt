-- Enable RLS for storage.objects if not already enabled (optional, but good practice)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; (Uncomment if needed, Supabase might handle this)

-- Policy: Allow public read access to 'user-uploads' bucket
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT
USING ( bucket_id = 'user-uploads' );

-- Policy: Allow authenticated users to upload into their own folder within 'user-uploads'
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (
    (storage.foldername(name))[1] = 'avatars'
    OR (storage.foldername(name))[1] = 'fields'
  )
);

-- Policy: Allow authenticated users to update/overwrite their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (
    (storage.foldername(name))[1] = 'avatars'
    OR (storage.foldername(name))[1] = 'fields'
  )
)
WITH CHECK (
  bucket_id = 'user-uploads'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (
    (storage.foldername(name))[1] = 'avatars'
    OR (storage.foldername(name))[1] = 'fields'
  )
);

-- Optional Policy: Allow authenticated users to delete their own files
-- CREATE POLICY "Allow authenticated deletes" ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'user-uploads'
--   AND auth.uid()::text = (storage.foldername(name))[2]
--   AND (
--     (storage.foldername(name))[1] = 'avatars'
--     OR (storage.foldername(name))[1] = 'fields'
--   )
-- );
