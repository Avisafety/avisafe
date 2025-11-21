-- Legg til mission_id kolonne i incidents tabellen
ALTER TABLE public.incidents 
ADD COLUMN mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL;

-- Legg til indeks for bedre ytelse
CREATE INDEX idx_incidents_mission_id ON public.incidents(mission_id);

-- Kommentar for dokumentasjon
COMMENT ON COLUMN public.incidents.mission_id IS 'Oppdrag som hendelsen er knyttet til';