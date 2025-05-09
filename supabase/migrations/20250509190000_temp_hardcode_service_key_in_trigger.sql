-- WARNING: THIS MIGRATION HARDCODES A SERVICE ROLE KEY FOR TEMPORARY TESTING.
-- IT MUST BE REVERTED IMMEDIATELY AFTER TESTING.

CREATE OR REPLACE FUNCTION public.trigger_send_push_notification_for_row()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  function_url TEXT;
  auth_token TEXT; -- This will be HARDCODED temporarily
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

    -- TEMPORARILY HARDCODE THE SERVICE ROLE KEY
    -- !!! REPLACE 'YOUR_ACTUAL_SERVICE_ROLE_KEY_PASTE_HERE' WITH YOUR ACTUAL KEY !!!
    auth_token := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcGxldnp3bnp5cmxzZ293a2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg1Nzg3NiwiZXhwIjoyMDYxNDMzODc2fQ.A_30k3AJ8b1q333KR6nZUqQXmPTVEG8VSW0eicFV38o'; 

    IF auth_token IS NULL OR auth_token = '' OR auth_token = 'YOUR_ACTUAL_SERVICE_ROLE_KEY_PASTE_HERE' THEN
      RAISE WARNING '[TEMP_HARDCODE_TRIGGER] Push notification for user_id % not sent because Service Role Key is missing or still a placeholder.', NEW.user_id;
      RETURN NEW; -- Exit if no auth token (or if it's the placeholder)
    END IF;

    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/send-expo-push-notification';

    -- Make the HTTP request to the Edge Function
    BEGIN
      PERFORM net.http_post(
          url := function_url,
          body := payload,
          headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || auth_token
          )
      );
      RAISE NOTICE '[TEMP_HARDCODE_TRIGGER] Push notification HTTP POST attempted for user_id: %, alert_id: %, title: %', NEW.user_id, NEW.id, NEW.title;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[TEMP_HARDCODE_TRIGGER] Error during HTTP POST: %', SQLERRM;
        RETURN NEW; -- Do not break the original transaction
    END;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[TEMP_HARDCODE_TRIGGER] Error in trigger_send_push_notification_for_row: %', SQLERRM;
    RETURN NEW; -- Important to return NEW even in case of error to not break the original transaction
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.trigger_send_push_notification_for_row IS 'TEMPORARILY MODIFIED: Uses a hardcoded service_role_key for testing push notifications. MUST BE REVERTED.';

-- Note: The trigger itself (on_new_user_alert_send_push_row) should still exist and use this function. 