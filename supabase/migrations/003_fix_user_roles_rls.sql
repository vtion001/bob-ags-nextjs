-- Fix RLS policies for user_roles table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create new policy: Anyone authenticated can view all roles (needed for admin to see pending users)
CREATE POLICY "Anyone can view roles" ON public.user_roles
  FOR SELECT USING (true);

-- Create policy: Users can insert their own role
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policy: Admins can update all roles
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Create policy: Admins can delete roles
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );
