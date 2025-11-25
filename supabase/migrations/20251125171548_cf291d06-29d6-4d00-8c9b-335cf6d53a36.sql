-- Update personnel_competencies type constraint to match UI options
ALTER TABLE personnel_competencies 
DROP CONSTRAINT IF EXISTS personnel_competencies_type_check;

ALTER TABLE personnel_competencies 
ADD CONSTRAINT personnel_competencies_type_check 
CHECK (type = ANY (ARRAY['Kurs', 'Sertifikat', 'Kompetanse', 'Lisens', 'Godkjenning', 'Annet']));