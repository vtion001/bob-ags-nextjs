-- Fix RLS for user_settings to allow admins to view all settings

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;

-- Create new policy: Users can manage their own settings
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid()::text = user_id);

-- Create policy: Admins can view all settings (needed for CTM assignments management)
CREATE POLICY "Admins can view all settings" ON public.user_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
    OR auth.uid()::text = user_id
  );
