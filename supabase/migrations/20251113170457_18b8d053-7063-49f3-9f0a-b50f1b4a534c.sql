-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  navn TEXT NOT NULL,
  type TEXT NOT NULL,
  serienummer TEXT NOT NULL,
  neste_vedlikehold TIMESTAMP WITH TIME ZONE,
  sist_vedlikeholdt TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'Grønn',
  tilgjengelig BOOLEAN NOT NULL DEFAULT true,
  merknader TEXT,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  opprettet_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  oppdatert_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create missions table
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tittel TEXT NOT NULL,
  lokasjon TEXT NOT NULL,
  beskrivelse TEXT,
  tidspunkt TIMESTAMP WITH TIME ZONE NOT NULL,
  slutt_tidspunkt TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'Planlagt',
  risk_nivå TEXT NOT NULL DEFAULT 'Lav',
  merknader TEXT,
  user_id UUID NOT NULL,
  opprettet_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  oppdatert_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for mission personnel
CREATE TABLE public.mission_personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(mission_id, profile_id)
);

-- Create junction table for mission equipment
CREATE TABLE public.mission_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  UNIQUE(mission_id, equipment_id)
);

-- Enable RLS on equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "All authenticated users can view equipment"
ON public.equipment
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Approved users can create equipment"
ON public.equipment
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.approved = true
  )
);

CREATE POLICY "Users can update own equipment"
ON public.equipment
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can update all equipment"
ON public.equipment
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'operativ_leder')
);

CREATE POLICY "Users can delete own equipment"
ON public.equipment
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all equipment"
ON public.equipment
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Enable RLS on missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Missions policies
CREATE POLICY "All authenticated users can view missions"
ON public.missions
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Approved users can create missions"
ON public.missions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.approved = true
  )
);

CREATE POLICY "Users can update own missions"
ON public.missions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can update all missions"
ON public.missions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'operativ_leder')
);

CREATE POLICY "Users can delete own missions"
ON public.missions
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all missions"
ON public.missions
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Enable RLS on mission_personnel
ALTER TABLE public.mission_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view mission personnel"
ON public.mission_personnel
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage mission personnel for their missions"
ON public.mission_personnel
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM missions 
    WHERE missions.id = mission_id 
    AND missions.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all mission personnel"
ON public.mission_personnel
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable RLS on mission_equipment
ALTER TABLE public.mission_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view mission equipment"
ON public.mission_equipment
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage mission equipment for their missions"
ON public.mission_equipment
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM missions 
    WHERE missions.id = mission_id 
    AND missions.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all mission equipment"
ON public.mission_equipment
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updating oppdatert_dato on equipment
CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating oppdatert_dato on missions
CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();