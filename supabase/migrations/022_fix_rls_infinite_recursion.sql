-- Migration: 022_fix_rls_infinite_recursion
-- Problem: The admin policy does a self-join on user_roles, triggering RLS when checking RLS,
-- causing infinite recursion (PostgreSQL error 42P17).
-- Fix: Create a SECURITY DEFINER helper function that bypasses RLS, then use it in policies.

-- Create a helper function that bypasses RLS (runs with creator privileges, not subject to RLS)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all users can execute this function
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ============================================================
-- FIX: user_roles table admin policies
-- ============================================================

-- Drop existing user_roles admin policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Recreate admin ALL policy using SECURITY DEFINER function
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()::uuid))
  WITH CHECK (public.is_admin(auth.uid()::uuid));

-- Recreate admin SELECT policy
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()::uuid));

-- ============================================================
-- FIX: users table admin policies (also had recursion issue)
-- ============================================================

-- Drop existing users admin policies
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update user roles" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;

-- Recreate admin policies using the SECURITY DEFINER function
CREATE POLICY "Admin can view all users" ON users
  FOR SELECT USING (public.is_admin(auth.uid()::uuid));

CREATE POLICY "Admin can update user roles" ON users
  FOR UPDATE USING (public.is_admin(auth.uid()::uuid));

CREATE POLICY "Admin can delete users" ON users
  FOR DELETE USING (public.is_admin(auth.uid()::uuid));
