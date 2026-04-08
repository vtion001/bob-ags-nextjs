-- Migration 015: Add paginated RPC for analyzed calls with dev bypass RLS
-- This creates a properly paginated RPC function for QA Logs page
-- and updates the calls RLS policy to allow dev user read access

-- First, update the RLS policy on calls table to allow dev user read access
DROP POLICY IF EXISTS "Users can access own calls" ON public.calls;

CREATE POLICY "Users can access own calls" ON public.calls
  FOR ALL USING (
    user_id = auth.uid()::text
    OR auth.uid()::text = '00000000-0000-0000-0000-000000000001'  -- dev bypass user
  );

-- Create the paginated RPC function for analyzed calls
CREATE OR REPLACE FUNCTION public.get_analyzed_calls_paginated(
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  ctm_call_id TEXT,
  phone TEXT,
  caller_number TEXT,
  direction TEXT,
  duration INTEGER,
  score INTEGER,
  sentiment TEXT,
  created_at TIMESTAMPTZ,
  agent_name TEXT,
  disposition TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return paginated results with total count
  RETURN QUERY
  SELECT
    c.id,
    c.ctm_call_id,
    c.phone,
    c.caller_number,
    c.direction,
    c.duration,
    c.score,
    c.sentiment,
    c.created_at,
    c.agent_name,
    c.disposition,
    COUNT(*) OVER() AS total_count
  FROM public.calls c
  WHERE c.score IS NOT NULL
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create a count-only function for pagination UI
CREATE OR REPLACE FUNCTION public.get_analyzed_calls_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.calls
  WHERE score IS NOT NULL;

  RETURN v_count;
END;
$$;
