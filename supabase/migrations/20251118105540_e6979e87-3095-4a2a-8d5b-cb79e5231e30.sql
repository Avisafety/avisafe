-- Legg til latitude og longitude kolonner i missions-tabellen
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Opprett indeks for raskere geografiske søk
CREATE INDEX IF NOT EXISTS idx_missions_coordinates ON missions(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Kommentar på kolonnene
COMMENT ON COLUMN missions.latitude IS 'Breddegrad for oppdragets lokasjon';
COMMENT ON COLUMN missions.longitude IS 'Lengdegrad for oppdragets lokasjon';

-- Aktiver realtime for missions-tabellen
ALTER PUBLICATION supabase_realtime ADD TABLE missions;