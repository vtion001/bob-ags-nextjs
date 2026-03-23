-- Migration: Backfill public.users from user_roles
-- This ensures all users in user_roles have corresponding entries in public.users

-- Insert missing users from user_roles that don't exist in public.users
INSERT INTO public.users (id, email, is_superadmin, created_at, updated_at)
SELECT 
  ur.user_id,
  ur.email,
  ur.role = 'admin',
  NOW(),
  NOW()
FROM user_roles ur
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = ur.user_id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  is_superadmin = EXCLUDED.is_superadmin,
  updated_at = NOW();

-- Create a trigger function to auto-create public.users entry when user_roles is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user exists in public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) THEN
    INSERT INTO public.users (id, email, is_superadmin)
    VALUES (
      NEW.user_id,
      NEW.email,
      NEW.role = 'admin'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_roles for INSERT
DROP TRIGGER IF EXISTS on_user_roles_insert ON user_roles;
CREATE TRIGGER on_user_roles_insert
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_roles();