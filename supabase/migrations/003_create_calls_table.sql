-- Migration 003: Create calls table for storing CTM call data

DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.calls_sync_log CASCADE;

CREATE TABLE public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ctm_call_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  phone TEXT,
  direction TEXT,
  duration INTEGER,
  status TEXT,
  timestamp TIMESTAMPTZ,
  caller_number TEXT,
  tracking_number TEXT,
  tracking_label TEXT,
  source TEXT,
  source_id TEXT,
  agent_id TEXT,
  agent_name TEXT,
  recording_url TEXT,
  transcript TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  talk_time INTEGER,
  wait_time INTEGER,
  ring_time INTEGER,
  score INTEGER,
  sentiment TEXT,
  summary TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  disposition TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX calls_user_id_idx ON public.calls(user_id);
CREATE INDEX calls_timestamp_idx ON public.calls(timestamp DESC);
CREATE INDEX calls_ctm_call_id_idx ON public.calls(ctm_call_id);
CREATE INDEX calls_agent_id_idx ON public.calls(agent_id);
CREATE INDEX calls_direction_idx ON public.calls(direction);
CREATE INDEX calls_synced_at_idx ON public.calls(synced_at DESC);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own calls" ON public.calls
  FOR ALL USING (user_id = auth.uid()::text);

CREATE TABLE public.calls_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  calls_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calls_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own sync logs" ON public.calls_sync_log
  FOR ALL USING (user_id = auth.uid()::text);
