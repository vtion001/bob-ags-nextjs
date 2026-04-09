-- Migration 020: Force-recreate user_roles RLS policies with UUID cast
-- Issue: auth.uid() returns text but user_id is UUID, causing RLS mismatch
-- This drops and recreates all policies to ensure proper ::uuid casting

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

-- Create Policies with auth.uid()::uuid for proper UUID comparison
-- user_id is UUID, auth.uid() returns text, so ::uuid cast is required

-- SELECT policy - user can view their own role
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- INSERT policy - user can insert their own role
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- UPDATE policy - user can update their own role
CREATE POLICY "Users can update own role" ON public.user_roles
  FOR UPDATE USING (auth.uid()::uuid = user_id);

-- DELETE policy - user can delete their own role
CREATE POLICY "Users can delete own role" ON public.user_roles
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- Admin policy - admin can do anything
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles AS ur
      WHERE ur.user_id = auth.uid()::uuid AND ur.role = 'admin'
    )
  );

-- Anyone can view roles (needed for admin to list all users)
CREATE POLICY "Anyone can view roles" ON public.user_roles
  FOR SELECT USING (true);
