-- REVERTS THE TRIGGER FUNCTION TO USE SUPABASE VAULT.
-- THIS REMOVES THE HARDCODED SERVICE ROLE KEY.

-- Clean up the unused function from the GUC attempt (if it somehow reappeared, defensive)
DROP FUNCTION IF EXISTS public.set_service_key(TEXT);

-- Recreate the trigger function to use Supabase Vault (original secure version)
CREATE OR REPLACE FUNCTION public.trigger_send_push_notification_for_row()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  function_url TEXT;
  auth_token TEXT; -- This will now be fetched from Vault
  project_ref TEXT := 'biplevzwnzyrlsgowkke'; -- Your Project Ref
BEGIN
  -- Only send for high or critical importance, and if it's a new, unread alert
  IF NEW.importance_level IN ('high', 'critical') AND NEW.is_read = FALSE THEN
    
    -- Construct the payload for the Edge Function
    payload := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message,
        'data', NEW.data 
    );

    BEGIN
      auth_token := supabase_vault.secret_get('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'VAULT_ERROR: Could not retrieve EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY from Vault. Error: %', SQLERRM;
        auth_token := NULL; 
    END;

    IF auth_token IS NULL THEN
      RAISE WARNING 'Push notification for user_id % not sent because Service Role Key could not be retrieved from Vault.', NEW.user_id;
      RETURN NEW; 
    END IF;

    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/send-expo-push-notification';

    BEGIN
      PERFORM net.http_post(
          url := function_url,
          body := payload,
          headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || auth_token
          )
      );
      RAISE NOTICE 'Push notification trigger called (via Vault attempt) for user_id: %, alert_id: %, title: %', NEW.user_id, NEW.id, NEW.title;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error during HTTP POST (Vault attempt): %', SQLERRM;
        RETURN NEW; 
    END;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in trigger_send_push_notification_for_row (Vault version): %', SQLERRM;
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.trigger_send_push_notification_for_row IS 'Restored: Trigger function to call send-expo-push-notification Edge Function using Supabase Vault for auth_token.';

-- Note: The trigger itself (on_new_user_alert_send_push_row) should still exist and use this function. 