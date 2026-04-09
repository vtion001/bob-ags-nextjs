-- Migration 019: Fix call_notes RLS policies
-- Problem: call_notes uses USING (true) - any authenticated user can read/write ALL call notes
-- Fix: Restrict access to users who own the call (via calls.user_id = auth.uid()::text)
-- Note: call_notes.call_id links to calls.ctm_call_id, and calls.user_id stores auth.uid()::text

-- ============================================
-- call_notes (migration 012)
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view call_notes" ON public.call_notes;
DROP POLICY IF EXISTS "Users can manage call_notes" ON public.call_notes;

-- Policy: Users can SELECT call_notes only for calls they own
-- Join: call_notes.call_id -> calls.ctm_call_id -> calls.user_id = auth.uid()::text
CREATE POLICY "Users can view call_notes for own calls" ON public.call_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.calls c
      WHERE c.ctm_call_id = call_notes.call_id AND c.user_id = auth.uid()::text
    )
  );

-- Policy: Users can INSERT call_notes only for calls they own
CREATE POLICY "Users can insert call_notes for own calls" ON public.call_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calls c
      WHERE c.ctm_call_id = call_notes.call_id AND c.user_id = auth.uid()::text
    )
  );

-- Policy: Users can UPDATE their own call_notes (ownership via call linkage)
CREATE POLICY "Users can update call_notes for own calls" ON public.call_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.calls c
      WHERE c.ctm_call_id = call_notes.call_id AND c.user_id = auth.uid()::text
    )
  );

-- Policy: Users can DELETE their own call_notes (ownership via call linkage)
CREATE POLICY "Users can delete call_notes for own calls" ON public.call_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.calls c
      WHERE c.ctm_call_id = call_notes.call_id AND c.user_id = auth.uid()::text
    )
  );
