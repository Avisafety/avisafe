-- =====================================================
-- Multi-Tenant Del 3: RLS Policies for Companies
-- =====================================================

DROP POLICY IF EXISTS "Users can view active companies for signup" ON public.companies;
DROP POLICY IF EXISTS "Superadmins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Superadmins can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Superadmins can update companies" ON public.companies;
DROP POLICY IF EXISTS "Superadmins can delete companies" ON public.companies;

CREATE POLICY "Users can view active companies for signup"
ON public.companies FOR SELECT
TO authenticated
USING (aktiv = true);

CREATE POLICY "Superadmins can view all companies"
ON public.companies FOR SELECT
TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete companies"
ON public.companies FOR DELETE
TO authenticated
USING (is_superadmin(auth.uid()));