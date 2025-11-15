-- Create mission_sora table for SORA (Specific Operations Risk Assessment) analyses
CREATE TABLE public.mission_sora (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id uuid NOT NULL UNIQUE REFERENCES public.missions(id) ON DELETE CASCADE,
  
  -- Operasjonsmiljø og ConOps
  environment text,
  conops_summary text,
  
  -- Bakkebasert risiko (GRC)
  igrc integer CHECK (igrc >= 1 AND igrc <= 7),
  ground_mitigations text,
  fgrc integer CHECK (fgrc >= 1 AND fgrc <= 7),
  
  -- Luftromsrisiko (ARC)
  arc_initial text,
  airspace_mitigations text,
  arc_residual text,
  
  -- SAIL og rest-risiko
  sail text,
  residual_risk_level text,
  residual_risk_comment text,
  operational_limits text,
  
  -- Status og godkjenning
  sora_status text NOT NULL DEFAULT 'Ikke startet',
  prepared_by uuid REFERENCES auth.users(id),
  prepared_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mission_sora ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mission_sora
CREATE POLICY "All authenticated users can view mission_sora"
  ON public.mission_sora
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Approved users can create mission_sora"
  ON public.mission_sora
  FOR INSERT
  WITH CHECK (
    auth.uid() = prepared_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.approved = true
    )
  );

CREATE POLICY "Users can update own mission_sora"
  ON public.mission_sora
  FOR UPDATE
  USING (auth.uid() = prepared_by);

CREATE POLICY "Admins and operativ_leder can update all mission_sora"
  ON public.mission_sora
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'operativ_leder'::app_role)
  );

CREATE POLICY "Admins can delete all mission_sora"
  ON public.mission_sora
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_mission_sora_updated_at
  BEFORE UPDATE ON public.mission_sora
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_mission_sora_mission_id ON public.mission_sora(mission_id);
CREATE INDEX idx_mission_sora_status ON public.mission_sora(sora_status);