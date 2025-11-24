-- =====================================================
-- Multi-Tenant Del 4: RLS Policies for Profiles (fikset)
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF (to_jsonb(NEW) ? 'updated_at') THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only approved users can access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from own company" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can approve users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can approve users in own company" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can approve all users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete users in own company" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can delete all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view profiles from own company"
ON public.profiles FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR auth.uid() = id);

CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Admins can approve users in own company"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can approve all users"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can delete users in own company"
ON public.profiles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can delete all users"
ON public.profiles FOR DELETE
TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);