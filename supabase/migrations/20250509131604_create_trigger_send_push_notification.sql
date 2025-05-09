-- Ensure pg_net is enabled in your Supabase project (Dashboard > Database > Extensions)
-- User has confirmed pg_net is enabled.

-- Drop existing trigger and function if they exist (for idempotency)
DROP TRIGGER IF EXISTS on_new_user_alert_send_push_row ON public.user_alerts;
DROP FUNCTION IF EXISTS public.trigger_send_push_notification_for_row();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.trigger_send_push_notification_for_row()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  function_url TEXT;
  auth_token TEXT;
  project_ref TEXT := 'biplevzwnzyrlsgowkke'; -- Your Project Ref
BEGIN
  -- Only send for high or critical importance, and if it's a new, unread alert
  IF NEW.importance_level IN ('high', 'critical') AND NEW.is_read = FALSE THEN

    -- Construct the payload for the Edge Function
    payload := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'data', NEW.data -- Assuming user_alerts.data is jsonb or compatible
    );

    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/send-expo-push-notification';
    
    -- Attempt to retrieve the service role key from PostgreSQL config variables
    -- THIS IS A CRITICAL STEP: 'app_settings.supabase_service_key' MUST be set in PostgreSQL configuration
    -- e.g., via: ALTER DATABASE postgres SET app_settings.supabase_service_key = 'your_service_role_key';
    auth_token := current_setting('app_settings.supabase_service_key', true);

    IF auth_token IS NULL OR auth_token = '' THEN
      RAISE WARNING '[trigger_send_push_notification_for_row] Service role key (app_settings.supabase_service_key) is not set in PostgreSQL config. Cannot call Edge Function.';
      RETURN NEW; -- Exit gracefully if key is not set
    END IF;

    BEGIN
      PERFORM net.http_post(
          url := function_url,
          body := payload,
          headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || auth_token
          )
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log any error during the HTTP POST request but don't let it fail the original transaction
        RAISE WARNING '[trigger_send_push_notification_for_row] Failed to call Edge Function for user_alert ID %: %', NEW.id, SQLERRM;
    END;

  END IF;

  RETURN NEW; -- For AFTER INSERT FOR EACH ROW, NEW is the row that was inserted.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER is used here. Ensure this is acceptable for your security model.
-- It allows the function to run with definer's privileges, which pg_net might need.

-- Create the trigger on the user_alerts table
CREATE TRIGGER on_new_user_alert_send_push_row
  AFTER INSERT ON public.user_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_push_notification_for_row();

COMMENT ON FUNCTION public.trigger_send_push_notification_for_row IS 'Trigger function to call send-expo-push-notification Edge Function for new important alerts.';
COMMENT ON TRIGGER on_new_user_alert_send_push_row ON public.user_alerts IS 'After inserting a new user alert, attempts to send a push notification if important.';
