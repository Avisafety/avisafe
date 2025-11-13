-- Create drones table
CREATE TABLE public.drones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modell TEXT NOT NULL,
  registrering TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Grønn',
  flyvetimer INTEGER NOT NULL DEFAULT 0,
  tilgjengelig BOOLEAN NOT NULL DEFAULT true,
  sist_inspeksjon TIMESTAMP WITH TIME ZONE,
  neste_inspeksjon TIMESTAMP WITH TIME ZONE,
  merknader TEXT,
  opprettet_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  oppdatert_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aktiv BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT drones_status_check CHECK (status IN ('Grønn', 'Gul', 'Rød'))
);

-- Enable RLS on drones
ALTER TABLE public.drones ENABLE ROW LEVEL SECURITY;

-- RLS policies for drones
CREATE POLICY "All authenticated users can view drones"
ON public.drones
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Approved users can create drones"
ON public.drones
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.approved = true
  )
);

CREATE POLICY "Users can update own drones"
ON public.drones
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can update all drones"
ON public.drones
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'operativ_leder')
);

CREATE POLICY "Users can delete own drones"
ON public.drones
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all drones"
ON public.drones
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create personnel_competencies table for tracking courses and competencies
CREATE TABLE public.personnel_competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  type TEXT NOT NULL,
  navn TEXT NOT NULL,
  beskrivelse TEXT,
  utstedt_dato DATE,
  utloper_dato DATE,
  opprettet_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  oppdatert_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT personnel_competencies_type_check CHECK (type IN ('Kurs', 'Sertifikat', 'Kompetanse'))
);

-- Enable RLS on personnel_competencies
ALTER TABLE public.personnel_competencies ENABLE ROW LEVEL SECURITY;

-- RLS policies for personnel_competencies
CREATE POLICY "All authenticated users can view personnel competencies"
ON public.personnel_competencies
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own competencies"
ON public.personnel_competencies
FOR INSERT
WITH CHECK (
  profile_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.approved = true
  )
);

CREATE POLICY "Admins and operativ_leder can create all competencies"
ON public.personnel_competencies
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'operativ_leder')
);

CREATE POLICY "Users can update own competencies"
ON public.personnel_competencies
FOR UPDATE
USING (profile_id = auth.uid());

CREATE POLICY "Admins and operativ_leder can update all competencies"
ON public.personnel_competencies
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'operativ_leder')
);

CREATE POLICY "Users can delete own competencies"
ON public.personnel_competencies
FOR DELETE
USING (profile_id = auth.uid());

CREATE POLICY "Admins can delete all competencies"
ON public.personnel_competencies
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at on drones
CREATE TRIGGER update_drones_updated_at
BEFORE UPDATE ON public.drones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on personnel_competencies
CREATE TRIGGER update_personnel_competencies_updated_at
BEFORE UPDATE ON public.personnel_competencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();