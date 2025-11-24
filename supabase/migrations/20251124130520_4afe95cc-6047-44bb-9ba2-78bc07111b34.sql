-- =====================================================
-- Multi-Tenant Del 6: RLS Policies for resten av tabellene
-- =====================================================

-- DRONES
DROP POLICY IF EXISTS "All authenticated users can view drones" ON public.drones;
DROP POLICY IF EXISTS "Approved users can create drones" ON public.drones;
DROP POLICY IF EXISTS "Users can update own drones" ON public.drones;
DROP POLICY IF EXISTS "Users can delete own drones" ON public.drones;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all drones" ON public.drones;
DROP POLICY IF EXISTS "Admins can delete all drones" ON public.drones;

CREATE POLICY "Users can view drones from own company" ON public.drones FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all drones" ON public.drones FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create drones in own company" ON public.drones FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own drones" ON public.drones FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update drones in own company" ON public.drones FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete own drones" ON public.drones FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete drones in own company" ON public.drones FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

-- EQUIPMENT
DROP POLICY IF EXISTS "All authenticated users can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Approved users can create equipment" ON public.equipment;
DROP POLICY IF EXISTS "Users can update own equipment" ON public.equipment;
DROP POLICY IF EXISTS "Users can delete own equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can delete all equipment" ON public.equipment;

CREATE POLICY "Users can view equipment from own company" ON public.equipment FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all equipment" ON public.equipment FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create equipment in own company" ON public.equipment FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own equipment" ON public.equipment FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update equipment in own company" ON public.equipment FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete own equipment" ON public.equipment FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete equipment in own company" ON public.equipment FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

-- NEWS
DROP POLICY IF EXISTS "All authenticated users can view news" ON public.news;
DROP POLICY IF EXISTS "Approved users can create news" ON public.news;
DROP POLICY IF EXISTS "Users can update their own news" ON public.news;
DROP POLICY IF EXISTS "Users can delete their own news" ON public.news;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all news" ON public.news;
DROP POLICY IF EXISTS "Admins and operativ_leder can delete all news" ON public.news;

CREATE POLICY "Users can view news from own company" ON public.news FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all news" ON public.news FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create news in own company" ON public.news FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own news" ON public.news FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update news in own company" ON public.news FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete own news" ON public.news FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete news in own company" ON public.news FOR DELETE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

-- CALENDAR EVENTS
DROP POLICY IF EXISTS "All authenticated users can view calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Approved users can create calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can delete all calendar events" ON public.calendar_events;

CREATE POLICY "Users can view calendar events from own company" ON public.calendar_events FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all calendar events" ON public.calendar_events FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create calendar events in own company" ON public.calendar_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own calendar events" ON public.calendar_events FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update calendar events in own company" ON public.calendar_events FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete own calendar events" ON public.calendar_events FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete calendar events in own company" ON public.calendar_events FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

-- CUSTOMERS
DROP POLICY IF EXISTS "All authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Approved users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete all customers" ON public.customers;

CREATE POLICY "Users can view customers from own company" ON public.customers FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all customers" ON public.customers FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create customers in own company" ON public.customers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update customers in own company" ON public.customers FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE TO authenticated
USING (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete customers in own company" ON public.customers FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

-- MISSION SORA
DROP POLICY IF EXISTS "All authenticated users can view mission_sora" ON public.mission_sora;
DROP POLICY IF EXISTS "Approved users can create mission_sora" ON public.mission_sora;
DROP POLICY IF EXISTS "Users can update own mission_sora" ON public.mission_sora;
DROP POLICY IF EXISTS "Admins and operativ_leder can update all mission_sora" ON public.mission_sora;
DROP POLICY IF EXISTS "Admins can delete all mission_sora" ON public.mission_sora;

CREATE POLICY "Users can view mission_sora from own company" ON public.mission_sora FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmins can view all mission_sora" ON public.mission_sora FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE POLICY "Approved users can create mission_sora in own company" ON public.mission_sora FOR INSERT TO authenticated
WITH CHECK (auth.uid() = prepared_by AND company_id = get_user_company_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true));

CREATE POLICY "Users can update own mission_sora" ON public.mission_sora FOR UPDATE TO authenticated
USING (auth.uid() = prepared_by AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can update mission_sora in own company" ON public.mission_sora FOR UPDATE TO authenticated
USING ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operativ_leder')) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete mission_sora in own company" ON public.mission_sora FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));