-- Migration 024: Fix RLS security vulnerabilities
--
-- Issues fixed:
-- 1. user_roles: "Users can update own role" allowed self-promotion to admin
--    (WITH CHECK was null, so only user_id ownership was checked, not the new role value)
-- 2. user_roles: "Users can delete own role" allowed users to remove their own role
--    (users should not be able to modify their own role — only admins/signup flow can)
-- 3. agent_profiles: "Authenticated users can insert/update/delete" used USING (true)
--    allowing any authenticated user to modify any agent profile

-- ============================================================
-- FIX 1 & 2: Remove self-modification policies on user_roles
-- Role assignment is handled by the on-auth-signup Edge Function
-- and by admin users only. Regular users must not touch their own role.
-- ============================================================

DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own role" ON public.user_roles;

-- Add back: Users can view their own role (removed in migration 024 but needed)
-- This was missing - users can't read their own role without this
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- ============================================================
-- FIX 3: Tighten agent_profiles write policies
-- All authenticated users may VIEW all profiles (needed to display agent names on calls).
-- Only admins OR the profile owner may INSERT/UPDATE/DELETE.
-- ============================================================

-- Drop the over-permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert agent profiles" ON public.agent_profiles;
DROP POLICY IF EXISTS "Authenticated users can update agent profiles" ON public.agent_profiles;
DROP POLICY IF EXISTS "Authenticated users can delete agent profiles" ON public.agent_profiles;

-- Re-create: own profile OR admin
CREATE POLICY "Users or admins can insert agent profiles" ON public.agent_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users or admins can update agent profiles" ON public.agent_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users or admins can delete agent profiles" ON public.agent_profiles
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );
