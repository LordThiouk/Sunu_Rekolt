-- Test alert insertion to verify Vault integration for push notifications

-- Ensure importance_level and data columns exist (idempotency)
ALTER TABLE public.user_alerts
ADD COLUMN IF NOT EXISTS importance_level TEXT NULL;

COMMENT ON COLUMN public.user_alerts.importance_level IS 'Importance level of the alert (e.g., critical, high, medium, low). Used by triggers to determine if a push notification should be sent.';

ALTER TABLE public.user_alerts
ADD COLUMN IF NOT EXISTS data JSONB NULL;

COMMENT ON COLUMN public.user_alerts.data IS 'Optional JSONB payload for additional data, e.g., for deep-linking.';

-- Insert a new test user_alert to trigger push notification flow (Vault test)
INSERT INTO public.user_alerts (user_id, title, message, type, importance_level, is_read, data, created_at, updated_at)
VALUES (
    '8070eacc-007a-4251-b0eb-661bc29c2215', -- Specific user_id with a known push token
    'Test Push (Vault Check)', -- Title of the alert
    'This alert was inserted to test Vault integration for push notifications.', -- Message body
    'new_user_admin', -- Type of alert (ensure this is a valid enum value)
    'critical', -- Importance level (to ensure trigger fires, changed to critical for test variety)
    FALSE, -- is_read status
    '{"screen": "Notifications", "alertId": "test-vault-migration-789"}', -- Optional JSONB data
    NOW(), -- Use current timestamp for created_at
    NOW()  -- Use current timestamp for updated_at
);

-- RAISE NOTICE 'Test user_alert for Vault check inserted for user_id 8070eacc-007a-4251-b0eb-661bc29c2215.'; 