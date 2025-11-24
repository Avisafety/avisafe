-- =====================================================
-- Multi-Tenant Del 1: Legg til superadmin rolle
-- =====================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';