-- Migration: Create calls table for caching CTM call data
-- Project: mmrhryddyjjkyhstytox

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ctm_call_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(50),
  direction VARCHAR(20),
  duration INTEGER,
  status VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE,
  caller_number VARCHAR(100),
  tracking_number VARCHAR(100),
  tracking_label VARCHAR(255),
  source VARCHAR(255),
  source_id VARCHAR(255),
  agent_id VARCHAR(255),
  agent_name VARCHAR(255),
  recording_url TEXT,
  transcript TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  notes TEXT,
  talk_time INTEGER,
  wait_time INTEGER,
  ring_time INTEGER,
  score INTEGER,
  sentiment VARCHAR(50),
  summary TEXT,
  tags TEXT[],
  disposition VARCHAR(255),
  follow_up BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_ctm_call_id ON calls(ctm_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own calls" ON calls;
DROP POLICY IF EXISTS "Users can insert their own calls" ON calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON calls;
DROP POLICY IF EXISTS "Users can delete their own calls" ON calls;

-- Policy: Users can only see their own calls
CREATE POLICY "Users can view their own calls"
  ON calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own calls
CREATE POLICY "Users can insert their own calls"
  ON calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own calls
CREATE POLICY "Users can update their own calls"
  ON calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own calls
CREATE POLICY "Users can delete their own calls"
  ON calls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_calls_updated_at();

-- Create sync_log table to track sync status
CREATE TABLE IF NOT EXISTS calls_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  calls_synced INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calls_sync_log ENABLE ROW LEVEL SECURITY;

-- Policy for sync_log
DROP POLICY IF EXISTS "Users can view own sync logs" ON calls_sync_log;
CREATE POLICY "Users can view own sync logs"
  ON calls_sync_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sync logs" ON calls_sync_log;
CREATE POLICY "Users can insert own sync logs"
  ON calls_sync_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
