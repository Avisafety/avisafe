-- Legg til kolonne for oppfølgingsansvarlig på incidents
ALTER TABLE public.incidents 
ADD COLUMN oppfolgingsansvarlig_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;