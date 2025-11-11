-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tittel TEXT NOT NULL,
  beskrivelse TEXT,
  hendelsestidspunkt TIMESTAMPTZ NOT NULL,
  alvorlighetsgrad TEXT NOT NULL CHECK (alvorlighetsgrad IN ('Lav', 'Middels', 'Høy', 'Kritisk')),
  status TEXT NOT NULL DEFAULT 'Åpen' CHECK (status IN ('Åpen', 'Under behandling', 'Ferdigbehandlet', 'Lukket')),
  kategori TEXT,
  lokasjon TEXT,
  rapportert_av TEXT,
  opprettet_dato TIMESTAMPTZ DEFAULT now(),
  oppdatert_dato TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all incidents"
  ON public.incidents
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create incidents"
  ON public.incidents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update incidents they created"
  ON public.incidents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete incidents they created"
  ON public.incidents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();