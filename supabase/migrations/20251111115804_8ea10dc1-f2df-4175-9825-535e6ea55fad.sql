-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'operativ_leder', 'pilot', 'tekniker', 'lesetilgang');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- user_roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update documents RLS policies
DROP POLICY IF EXISTS "Users can view documents" ON public.documents;

CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can view all documents"
ON public.documents FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'operativ_leder')
);

CREATE POLICY "Lesetilgang can view all documents"
ON public.documents FOR SELECT
USING (public.has_role(auth.uid(), 'lesetilgang'));

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all documents"
ON public.documents FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;

CREATE POLICY "Users can update own documents"
ON public.documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can update all documents"
ON public.documents FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'operativ_leder')
);

-- Update incidents RLS policies  
DROP POLICY IF EXISTS "Users can view all incidents" ON public.incidents;

CREATE POLICY "All authenticated users can view incidents"
ON public.incidents FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete incidents they created" ON public.incidents;

CREATE POLICY "Users can delete own incidents"
ON public.incidents FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all incidents"
ON public.incidents FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update incidents they created" ON public.incidents;

CREATE POLICY "Users can update own incidents"
ON public.incidents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and operativ_leder can update all incidents"
ON public.incidents FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'operativ_leder')
);