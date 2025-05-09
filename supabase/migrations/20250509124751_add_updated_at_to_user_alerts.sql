-- Add updated_at column to user_alerts table
ALTER TABLE public.user_alerts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create or replace the trigger function to handle auto-updating updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create the new trigger
-- (Ensures idempotency if script is run multiple times, though migrations should run once)
DROP TRIGGER IF EXISTS on_user_alerts_updated ON public.user_alerts;
CREATE TRIGGER on_user_alerts_updated
  BEFORE UPDATE ON public.user_alerts
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Optional: Backfill existing rows with a sensible updated_at value
-- This is useful if you have existing data and want updated_at to be populated.
-- If the table is new or empty, this can be skipped or modified.
-- For existing rows, created_at is often a good default for the initial updated_at.
UPDATE public.user_alerts
SET updated_at = created_at
WHERE updated_at IS NULL;
