-- Remove the confusing trigger from incidents table
-- This trigger tries to set 'updated_at' but the table uses 'oppdatert_dato'
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;