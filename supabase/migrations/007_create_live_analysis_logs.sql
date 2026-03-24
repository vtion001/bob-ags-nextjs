-- Migration: Create live_analysis_logs table
-- This table stores all live AI analysis results from monitoring sessions

CREATE TABLE IF NOT EXISTS live_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  call_id TEXT,
  call_phone TEXT,
  call_direction TEXT,
  call_timestamp TIMESTAMPTZ,
  suggested_disposition TEXT,
  insights JSONB,
  transcript_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by user and call
CREATE INDEX IF NOT EXISTS idx_live_analysis_logs_user_id ON live_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_live_analysis_logs_call_id ON live_analysis_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_live_analysis_logs_created_at ON live_analysis_logs(created_at DESC);

-- Add RLS policies
ALTER TABLE live_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view their own live analysis logs"
  ON live_analysis_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own live analysis logs"
  ON live_analysis_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE live_analysis_logs IS 'Stores all live AI analysis results from call monitoring sessions';
COMMENT ON COLUMN live_analysis_logs.insights IS 'JSON array of insight objects with type, title, message, priority, timestamp';
COMMENT ON COLUMN live_analysis_logs.transcript_preview IS 'First 500 characters of transcript for context';
