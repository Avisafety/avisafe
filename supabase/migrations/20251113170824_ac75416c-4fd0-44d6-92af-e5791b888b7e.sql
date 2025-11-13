-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  navn TEXT NOT NULL,
  kontaktperson TEXT,
  telefon TEXT,
  epost TEXT,
  adresse TEXT,
  merknader TEXT,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  opprettet_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  oppdatert_dato TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add customer_id to missions table
ALTER TABLE public.missions
ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "All authenticated users can view customers"
ON public.customers
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Approved users can create customers"
ON public.customers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.approved = true
  )
);

CREATE POLICY "Users can update own customers"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can update all customers"
ON public.customers
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'operativ_leder')
);

CREATE POLICY "Users can delete own customers"
ON public.customers
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all customers"
ON public.customers
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updating oppdatert_dato on customers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();