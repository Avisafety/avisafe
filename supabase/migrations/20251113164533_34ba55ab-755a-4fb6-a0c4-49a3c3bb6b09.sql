-- Create news table
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tittel TEXT NOT NULL,
  innhold TEXT NOT NULL,
  publisert TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  forfatter TEXT NOT NULL,
  synlighet TEXT NOT NULL DEFAULT 'Alle',
  pin_on_top BOOLEAN NOT NULL DEFAULT false,
  opprettet_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  oppdatert_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Create policies for news access
CREATE POLICY "All authenticated users can view news" 
ON public.news 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can delete their own news" 
ON public.news 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can delete all news" 
ON public.news 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operativ_leder'::app_role));

CREATE POLICY "Users can update their own news" 
ON public.news 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can update all news" 
ON public.news 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operativ_leder'::app_role));

CREATE POLICY "Approved users can create news" 
ON public.news 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.approved = true
  ))
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_oppdatert_dato
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();