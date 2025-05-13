-- Migration to set app_settings.supabase_service_key GUC
-- IMPORTANT: After this file is generated, you MUST manually replace
-- 'PLACEHOLDER_REPLACE_WITH_REAL_KEY' with your actual Service Role Key.

-- Create or replace the security definer function
CREATE OR REPLACE FUNCTION public.set_service_key(new_key TEXT)
RETURNS void AS $$
BEGIN
    -- This function runs with the permissions of the user who DEFINED it.
    -- Ensure the role defining this (typically 'postgres' or 'supabase_admin' during migrations)
    -- has permission to ALTER DATABASE.
    EXECUTE format('ALTER DATABASE postgres SET app_settings.supabase_service_key = %L', new_key);
    RAISE NOTICE 'app_settings.supabase_service_key has been set.';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE WARNING 'Permission denied to set app_settings.supabase_service_key. The user defining/running this function may lack ALTER DATABASE privileges. %', SQLERRM;
        RAISE NOTICE 'The GUC app_settings.supabase_service_key was NOT set.';
    WHEN OTHERS THEN
        RAISE WARNING 'An error occurred while trying to set app_settings.supabase_service_key: %', SQLERRM;
        RAISE NOTICE 'The GUC app_settings.supabase_service_key was NOT set.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function to set the key
-- !!! IMPORTANT: MANUALLY REPLACE THE PLACEHOLDER BELOW WITH YOUR ACTUAL SERVICE ROLE KEY !!!
SELECT public.set_service_key('');

-- Optional: Revoke execute permission on the function after use if desired for security,
-- though for a one-time setup this might be overkill.
-- REVOKE EXECUTE ON FUNCTION public.set_service_key(TEXT) FROM PUBLIC; -- Example: Revoke from all
-- REVOKE EXECUTE ON FUNCTION public.set_service_key(TEXT) FROM authenticated; -- Example
