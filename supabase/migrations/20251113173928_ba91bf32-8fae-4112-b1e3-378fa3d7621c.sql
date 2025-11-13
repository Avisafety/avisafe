-- Add foreign key constraint from personnel_competencies to profiles
ALTER TABLE public.personnel_competencies
ADD CONSTRAINT personnel_competencies_profile_id_fkey 
FOREIGN KEY (profile_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;