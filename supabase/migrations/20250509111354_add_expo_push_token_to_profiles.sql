-- Add expo_push_token column to profiles table
ALTER TABLE public.profiles
ADD COLUMN expo_push_token TEXT;

-- Enable RLS for the new column if not already enabled for the table
-- Assuming RLS is already enabled on the 'profiles' table.
-- If not, you would add: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for expo_push_token
-- Users can update their own expo_push_token
CREATE POLICY "Allow users to update their own expo_push_token"
ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can read their own expo_push_token (optional, but can be useful for client-side checks)
CREATE POLICY "Allow users to read their own expo_push_token"
ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Admins can read and update any expo_push_token (assuming an 'admin' role exists and can be checked, e.g., via a helper function or direct role check)
-- This is a placeholder for admin policy; actual implementation might vary based on how admin roles are defined.
-- Example if you have a function get_my_claim('userrole') that returns the role as text:
-- CREATE POLICY "Allow admins to manage all expo_push_tokens"
-- ON public.profiles
-- FOR ALL USING (get_my_claim('userrole') = 'admin'::text)
-- WITH CHECK (get_my_claim('userrole') = 'admin'::text);

-- For simplicity, if you don't have a complex admin role check setup yet,
-- you might rely on service_role key for admin operations via the Supabase client library from a secure backend/admin interface.
-- Or, if admins are just specific UIDs, you could hardcode them or use a separate 'admin_users' table.

-- For now, we'll focus on user-specific policies. Admin access via service_role key is often sufficient for backend tasks.

COMMENT ON COLUMN public.profiles.expo_push_token IS 'Stores the Expo Push Token for the user to receive push notifications.';
