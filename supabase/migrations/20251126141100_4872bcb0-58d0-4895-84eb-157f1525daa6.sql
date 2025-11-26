-- Create junction table for mission-drone relationships
CREATE TABLE IF NOT EXISTS public.mission_drones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  drone_id UUID NOT NULL REFERENCES public.drones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mission_drones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mission_drones
CREATE POLICY "All authenticated users can view mission drones"
ON public.mission_drones
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage mission drones for their missions"
ON public.mission_drones
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.missions
    WHERE missions.id = mission_drones.mission_id
    AND missions.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all mission drones"
ON public.mission_drones
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add index for better performance
CREATE INDEX idx_mission_drones_mission_id ON public.mission_drones(mission_id);
CREATE INDEX idx_mission_drones_drone_id ON public.mission_drones(drone_id);