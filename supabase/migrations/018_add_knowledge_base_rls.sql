-- Migration 018: Add RLS policies for knowledge_base table
-- SELECT: Any authenticated user can view knowledge base entries (reference material)
-- INSERT/UPDATE/DELETE: Only admins can modify entries

-- ============================================
-- knowledge_base
-- ============================================
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- SELECT policy: any authenticated user can view entries
DROP POLICY IF EXISTS "Authenticated users can view knowledge base" ON public.knowledge_base;
CREATE POLICY "Authenticated users can view knowledge base"
  ON public.knowledge_base FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy: only admins can insert
DROP POLICY IF EXISTS "Admins can insert knowledge base entries" ON public.knowledge_base;
CREATE POLICY "Admins can insert knowledge base entries"
  ON public.knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- UPDATE policy: only admins can update
DROP POLICY IF EXISTS "Admins can update knowledge base entries" ON public.knowledge_base;
CREATE POLICY "Admins can update knowledge base entries"
  ON public.knowledge_base FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- DELETE policy: only admins can delete
DROP POLICY IF EXISTS "Admins can delete knowledge base entries" ON public.knowledge_base;
CREATE POLICY "Admins can delete knowledge base entries"
  ON public.knowledge_base FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()::uuid AND role = 'admin'
    )
  );
