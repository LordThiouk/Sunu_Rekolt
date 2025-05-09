-- Clean up the unused function from the previous GUC attempt
DROP FUNCTION IF EXISTS public.set_service_key(TEXT);

-- Recreate the trigger function to use Supabase Vault
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
        'data', NEW.data -- Assuming NEW.data is already a valid JSON object or null
    );

    -- Get the Service Role Key from Supabase Vault
    -- Ensure the Vault secret named 'EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY' exists and contains the Service Role Key.
    -- Also ensure the 'supabase_vault' extension is enabled and accessible.
    BEGIN
      auth_token := supabase_vault.secret_get('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'VAULT_ERROR: Could not retrieve EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY from Vault. Error: %', SQLERRM;
        auth_token := NULL; -- Ensure auth_token is null if retrieval fails
    END;

    IF auth_token IS NULL THEN
      RAISE WARNING 'Push notification for user_id % not sent because Service Role Key could not be retrieved from Vault.', NEW.user_id;
      RETURN NEW; -- Exit if no auth token
    END IF;

    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/send-expo-push-notification';

    -- Make the HTTP request to the Edge Function
    PERFORM net.http_post(
        url := function_url,
        body := payload,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || auth_token
        )
    );
    RAISE NOTICE 'Push notification trigger called for user_id: %, alert_id: %, title: %', NEW.user_id, NEW.id, NEW.title;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in trigger_send_push_notification_for_row: %', SQLERRM;
    RETURN NEW; -- Important to return NEW even in case of error to not break the original transaction
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself (on_new_user_alert_send_push_row) should already exist from migration
-- 20250509131604_create_trigger_send_push_notification.sql.
-- If you needed to recreate it, you would add:
-- DROP TRIGGER IF EXISTS on_new_user_alert_send_push_row ON public.user_alerts;
-- CREATE TRIGGER on_new_user_alert_send_push_row
--   AFTER INSERT ON public.user_alerts
--   FOR EACH ROW
--   EXECUTE PROCEDURE public.trigger_send_push_notification_for_row();

-- RAISE NOTICE 'Migration update_trigger_to_use_vault applied successfully.'; -- Removed due to syntax error outside PL/pgSQL block
