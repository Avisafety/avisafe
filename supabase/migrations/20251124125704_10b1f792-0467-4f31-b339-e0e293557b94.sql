-- =====================================================
-- Multi-Tenant Del 2: Hovedimplementering
-- =====================================================

-- FASE 1: Opprett sikker trigger-funksjon
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF (to_jsonb(NEW) ? 'updated_at') THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FASE 2: Opprett Companies tabell
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navn TEXT NOT NULL UNIQUE,
  org_nummer TEXT UNIQUE,
  adresse TEXT,
  kontakt_epost TEXT,
  kontakt_telefon TEXT,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Opprett AviSafe som default selskap
INSERT INTO public.companies (id, navn, aktiv)
VALUES ('11111111-1111-1111-1111-111111111111', 'AviSafe', true)
ON CONFLICT (id) DO NOTHING;

-- FASE 3: Legg til company_id i profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

UPDATE public.profiles 
SET company_id = '11111111-1111-1111-1111-111111111111'
WHERE company_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_id' AND is_nullable = 'YES') THEN
    ALTER TABLE public.profiles ALTER COLUMN company_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- FASE 4: Legg til company_id i andre tabeller
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.missions SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = missions.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.missions ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_missions_company_id ON public.missions(company_id);

ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.incidents SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = incidents.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.incidents ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_company_id ON public.incidents(company_id);

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.documents SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = documents.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.documents ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);

ALTER TABLE public.drones ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.drones SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = drones.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.drones ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drones_company_id ON public.drones(company_id);

ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.equipment SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = equipment.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.equipment ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_company_id ON public.equipment(company_id);

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.news SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = news.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.news ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_company_id ON public.news(company_id);

ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.calendar_events SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = calendar_events.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.calendar_events ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_id ON public.calendar_events(company_id);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.customers SET company_id = COALESCE((SELECT company_id FROM public.profiles WHERE id = customers.user_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.customers ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);

ALTER TABLE public.mission_sora ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.mission_sora SET company_id = COALESCE((SELECT company_id FROM public.missions WHERE id = mission_sora.mission_id), '11111111-1111-1111-1111-111111111111') WHERE company_id IS NULL;
ALTER TABLE public.mission_sora ALTER COLUMN company_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mission_sora_company_id ON public.mission_sora(company_id);

-- FASE 5: Opprett helper-funksjoner
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- FASE 6: Oppdater handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'company_id')::uuid, '11111111-1111-1111-1111-111111111111')
  );
  RETURN NEW;
END;
$$;