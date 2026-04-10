-- Migration 021: Fix user_roles RLS security issues
-- Issues fixed:
-- 1. Removed "Anyone can view roles" policy (USING (true)) which allowed any user to see ALL rows
-- 2. Added WITH CHECK to admin policy for proper row-level security
-- 3. Created admin-only SELECT policy to replace "Anyone can view roles"

-- Drop the insecure "Anyone can view roles" policy
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

-- Drop existing admin policy (will recreate with WITH CHECK)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Recreate admin policy with WITH CHECK clause
-- USING controls who can SEE the rows, WITH CHECK controls who can INSERT/UPDATE
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles AS ur
      WHERE ur.user_id = auth.uid()::uuid AND ur.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles AS ur
      WHERE ur.user_id = auth.uid()::uuid AND ur.role = 'admin'
    )
  );

-- Create admin-only SELECT policy (replaces "Anyone can view roles")
-- Only admins can view all rows; regular users can only view their own role via "Users can view own role"
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  );
