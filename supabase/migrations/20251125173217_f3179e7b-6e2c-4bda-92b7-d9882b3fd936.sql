-- Drop the old check constraint
ALTER TABLE public.personnel_competencies 
DROP CONSTRAINT IF EXISTS personnel_competencies_type_check;

-- Add updated check constraint with "Utdanning" included
ALTER TABLE public.personnel_competencies 
ADD CONSTRAINT personnel_competencies_type_check 
CHECK (type = ANY (ARRAY['Kurs'::text, 'Sertifikat'::text, 'Lisens'::text, 'Utdanning'::text, 'Godkjenning'::text, 'Kompetanse'::text, 'Annet'::text]));