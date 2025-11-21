-- Add missing columns to documents table for the new documents page
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS beskrivelse TEXT,
ADD COLUMN IF NOT EXISTS nettside_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.documents.beskrivelse IS 'Description of the document';
COMMENT ON COLUMN public.documents.nettside_url IS 'Website URL if the document is a web resource';