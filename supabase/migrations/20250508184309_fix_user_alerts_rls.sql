-- Enable RLS for user_alerts if not already enabled
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to create alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.user_alerts;
DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.user_alerts;

-- Policy for INSERTING alerts (CRITICAL for your current bug)
CREATE POLICY "Allow authenticated users to create alerts"
ON public.user_alerts
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allows any authenticated user to insert. The app logic ensures the correct recipient.

-- Policy for SELECTING/READING alerts (Highly Recommended)
CREATE POLICY "Users can view their own alerts"
ON public.user_alerts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id); -- Ensure 'user_id' is the column referencing the recipient's ID

-- Policy for UPDATING alerts (Recommended, e.g., for marking as read)
CREATE POLICY "Users can update their own alerts"
ON public.user_alerts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) -- Ensure 'user_id' is the column referencing the recipient's ID
WITH CHECK (auth.uid() = user_id); -- Ensures they don't change the alert to belong to someone else

-- Policy for DELETING alerts (Optional, if users should be able to delete their alerts)
CREATE POLICY "Users can delete their own alerts"
ON public.user_alerts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); -- Ensure 'user_id' is the column referencing the recipient's ID
