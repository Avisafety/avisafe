-- Opprett tabell for hendelseskommentarer
CREATE TABLE public.incident_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_by_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT comment_text_not_empty CHECK (char_length(comment_text) > 0)
);

-- Indeks for raskere queries
CREATE INDEX idx_incident_comments_incident_id ON public.incident_comments(incident_id);
CREATE INDEX idx_incident_comments_created_at ON public.incident_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Alle autentiserte brukere kan se kommentarer
CREATE POLICY "All authenticated users can view comments"
  ON public.incident_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Godkjente brukere kan legge til kommentarer
CREATE POLICY "Approved users can create comments"
  ON public.incident_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.approved = true
    )
  );

-- INGEN DELETE eller UPDATE policies - kommentarer kan aldri slettes eller endres!