-- Create junction table for drone-equipment relationship
CREATE TABLE IF NOT EXISTS public.drone_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drone_id UUID NOT NULL REFERENCES public.drones(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(drone_id, equipment_id)
);

-- Enable RLS
ALTER TABLE public.drone_equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view drone equipment from own company"
  ON public.drone_equipment
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drones
      WHERE drones.id = drone_equipment.drone_id
      AND drones.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Approved users can create drone equipment in own company"
  ON public.drone_equipment
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drones
      WHERE drones.id = drone_equipment.drone_id
      AND drones.company_id = get_user_company_id(auth.uid())
      AND drones.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.approved = true
    )
  );

CREATE POLICY "Admins can manage all drone equipment in own company"
  ON public.drone_equipment
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') 
    AND EXISTS (
      SELECT 1 FROM public.drones
      WHERE drones.id = drone_equipment.drone_id
      AND drones.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can delete own drone equipment"
  ON public.drone_equipment
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.drones
      WHERE drones.id = drone_equipment.drone_id
      AND drones.user_id = auth.uid()
      AND drones.company_id = get_user_company_id(auth.uid())
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_drone_equipment_drone_id ON public.drone_equipment(drone_id);
CREATE INDEX IF NOT EXISTS idx_drone_equipment_equipment_id ON public.drone_equipment(equipment_id);