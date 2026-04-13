-- Migration 023: Fix user_settings admin SELECT policy to use SECURITY DEFINER is_admin()
-- The old policy did a direct subquery on user_roles which was fragile (same recursion pattern
-- that previously broke user_roles itself). Now uses the safe is_admin() function.

DROP POLICY IF EXISTS "Admins can view all settings" ON public.user_settings;

CREATE POLICY "Admins can view all settings" ON public.user_settings
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR (auth.uid() = user_id)
  );
