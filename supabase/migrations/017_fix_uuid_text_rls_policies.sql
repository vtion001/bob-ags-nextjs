-- Migration 017: Fix UUID/text comparison in RLS policies
-- Problem: auth.uid() returns text but user_id columns are UUID
-- Fix: Cast auth.uid() to UUID in all RLS policy comparisons
-- Applies to: agent_profiles, live_analysis_logs, user_settings, user_roles,
--             notes_log, ctm_assignments, qa_overrides

-- ============================================
-- agent_profiles (migration 001)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own agent profiles" ON agent_profiles;
DROP POLICY IF EXISTS "Users can insert their own agent profiles" ON agent_profiles;
DROP POLICY IF EXISTS "Users can update their own agent profiles" ON agent_profiles;
DROP POLICY IF EXISTS "Users can delete their own agent profiles" ON agent_profiles;

CREATE POLICY "Users can view their own agent profiles"
  ON agent_profiles FOR SELECT TO authenticated
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own agent profiles"
  ON agent_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own agent profiles"
  ON agent_profiles FOR UPDATE TO authenticated
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own agent profiles"
  ON agent_profiles FOR DELETE TO authenticated
  USING (auth.uid()::uuid = user_id);

-- ============================================
-- live_analysis_logs (migration 007)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own live analysis logs" ON live_analysis_logs;
DROP POLICY IF EXISTS "Users can insert their own live analysis logs" ON live_analysis_logs;

CREATE POLICY "Users can view their own live analysis logs"
  ON live_analysis_logs FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own live analysis logs"
  ON live_analysis_logs FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

-- ============================================
-- user_settings (migration 013)
-- ============================================
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Admins can view all settings" ON public.user_settings;

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

-- Admin policy: cast both sides since user_roles.user_id is also UUID
CREATE POLICY "Admins can view all settings" ON public.user_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
    OR auth.uid()::uuid = user_id
  );

-- ============================================
-- user_roles (migration 014)
-- ============================================
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own role" ON public.user_roles
  FOR UPDATE USING (auth.uid()::uuid = user_id);

-- Note: the "Admins can manage roles" policy references user_roles.user_id
-- which is now UUID, so auth.uid()::uuid must be used
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles AS ur
      WHERE ur.user_id = auth.uid()::uuid AND ur.role = 'admin'
    )
  );

-- ============================================
-- notes_log (migration 011)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own notes logs" ON notes_log;
DROP POLICY IF EXISTS "Users can insert their own notes logs" ON notes_log;
DROP POLICY IF EXISTS "Users can update their own notes logs" ON notes_log;
DROP POLICY IF EXISTS "Users can delete their own notes logs" ON notes_log;

CREATE POLICY "Users can view their own notes logs" ON notes_log
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own notes logs" ON notes_log
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own notes logs" ON notes_log
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own notes logs" ON notes_log
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- ============================================
-- ctm_assignments (migration 012)
-- ============================================
DROP POLICY IF EXISTS "Users can view own ctm_assignments" ON public.ctm_assignments;
DROP POLICY IF EXISTS "Users can manage own ctm_assignments" ON public.ctm_assignments;
DROP POLICY IF EXISTS "Admins can view all ctm_assignments" ON public.ctm_assignments;

CREATE POLICY "Users can view own ctm_assignments" ON public.ctm_assignments
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage own ctm_assignments" ON public.ctm_assignments
  FOR ALL USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can view all ctm_assignments" ON public.ctm_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- ============================================
-- qa_overrides (migration 009) - user_id is UUID
-- ============================================
-- Check if qa_overrides exists and what policies it has
DROP POLICY IF EXISTS "Users can view own qa_overrides" ON public.qa_overrides;
DROP POLICY IF EXISTS "Users can insert own qa_overrides" ON public.qa_overrides;
DROP POLICY IF EXISTS "Users can update own qa_overrides" ON public.qa_overrides;

ALTER TABLE public.qa_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own qa_overrides" ON public.qa_overrides
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own qa_overrides" ON public.qa_overrides
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own qa_overrides" ON public.qa_overrides
  FOR UPDATE USING (auth.uid()::uuid = user_id);
