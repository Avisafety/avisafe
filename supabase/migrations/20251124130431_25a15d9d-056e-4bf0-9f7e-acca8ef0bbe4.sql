-- =====================================================
-- Multi-Tenant Del 5: RLS Policies for Missions, Incidents, Documents
-- =====================================================

-- MISSIONS
DROP POLICY IF EXISTS "All authenticated users can view missions" ON public.missions;
DROP POLICY IF EXISTS "Approved users can create missions" ON public.missions;
DROP POLICY IF EXISTS "Users can update own missions" ON public.missions;
DROP POLICY IF EXISTS "Users can delete own missions" ON public.missions;
DROP POLICY IF EXISTS "Admins can delete all missions" ON public.missions;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all missions" ON public.missions;

CREATE POLICY "Users can view missions from own company" ON public.missions FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all missions" ON public.missions FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create missions in own company" ON public.missions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own missions" ON public.missions FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update missions in own company" ON public.missions FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can update all missions" ON public.missions FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can delete own missions" ON public.missions FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete missions in own company" ON public.missions FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can delete all missions" ON public.missions FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()));

-- INCIDENTS
DROP POLICY IF EXISTS "All authenticated users can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Approved users can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can update own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can delete own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can delete all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all incidents" ON public.incidents;

CREATE POLICY "Users can view incidents from own company" ON public.incidents FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all incidents" ON public.incidents FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create incidents in own company" ON public.incidents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own incidents" ON public.incidents FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update incidents in own company" ON public.incidents FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can update all incidents" ON public.incidents FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can delete own incidents" ON public.incidents FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete incidents in own company" ON public.incidents FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can delete all incidents" ON public.incidents FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()));

-- DOCUMENTS
DROP POLICY IF EXISTS "Admins and operativ_leder can update all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins and operativ_leder can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete all documents" ON public.documents;
DROP POLICY IF EXISTS "Approved users can create documents" ON public.documents;
DROP POLICY IF EXISTS "Lesetilgang can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;

CREATE POLICY "Users can view documents from own company" ON public.documents FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all documents" ON public.documents FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create documents in own company" ON public.documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update documents in own company" ON public.documents FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can update all documents" ON public.documents FOR UPDATE TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete documents in own company" ON public.documents FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can delete all documents" ON public.documents FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()));