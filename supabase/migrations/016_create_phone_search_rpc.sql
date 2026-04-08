-- Migration 016: Create RPC function for searching calls by phone number in Supabase
-- This enables searching historical calls that have been synced via bulk sync

CREATE OR REPLACE FUNCTION public.search_calls_by_phone(p_phone TEXT)
RETURNS TABLE (
  id UUID,
  ctm_call_id TEXT,
  phone TEXT,
  caller_number TEXT,
  direction TEXT,
  duration INTEGER,
  status TEXT,
  timestamp TIMESTAMPTZ,
  agent_name TEXT,
  score INTEGER,
  sentiment TEXT,
  disposition TEXT,
  source TEXT,
  city TEXT,
  state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.ctm_call_id,
    c.phone,
    c.caller_number,
    c.direction,
    c.duration,
    c.status,
    c.timestamp,
    c.agent_name,
    c.score,
    c.sentiment,
    c.disposition,
    c.source,
    c.city,
    c.state
  FROM public.calls c
  WHERE
    c.phone ILIKE '%' || p_phone || '%'
    OR c.caller_number ILIKE '%' || p_phone || '%'
    OR REPLACE(c.phone, '+', '') ILIKE '%' || p_phone || '%'
    OR REPLACE(c.caller_number, '+', '') ILIKE '%' || p_phone || '%'
  ORDER BY c.timestamp DESC
  LIMIT 100;
END;
$$;
