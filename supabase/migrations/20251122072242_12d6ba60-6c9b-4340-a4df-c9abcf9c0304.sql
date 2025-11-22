-- Fix notification_preferences trigger issue
-- The table uses 'updated_at' but a trigger is trying to set 'oppdatert_dato'

-- First, drop any existing incorrect trigger
DROP TRIGGER IF EXISTS update_notification_preferences_oppdatert_dato ON notification_preferences;

-- Create the correct trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the correct trigger for notification_preferences
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();