-- ============================================================
-- BOB Database Schema — Azure Database for PostgreSQL
-- All Supabase-specific RLS and auth.users refs removed.
-- Authorization enforced by Laravel at the application layer.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- UTILITY TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: users
-- Core identity. Laravel manages password hashing and auth.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          TEXT UNIQUE NOT NULL,
  password       TEXT NOT NULL,
  full_name      TEXT,
  avatar_url     TEXT,
  is_superadmin  BOOLEAN NOT NULL DEFAULT FALSE,
  remember_token TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('admin', 'manager', 'viewer', 'qa', 'agent')),
  permissions JSONB NOT NULL DEFAULT '{
    "can_view_calls": true,
    "can_view_monitor": true,
    "can_view_history": false,
    "can_view_agents": false,
    "can_manage_settings": false,
    "can_manage_users": false,
    "can_run_analysis": false
  }'::jsonb,
  approved    BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: user_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  settings   JSONB NOT NULL DEFAULT '{
    "ctm_access_key": "",
    "ctm_secret_key": "",
    "ctm_account_id": "",
    "openrouter_api_key": "",
    "ctm_agent_id": null,
    "theme": "dark",
    "notifications_enabled": true,
    "auto_sync_calls": true,
    "call_sync_interval": 60
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: agent_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  agent_id   VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  phone      VARCHAR(50),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON public.agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_agent_id ON public.agent_profiles(agent_id);
CREATE TRIGGER trg_agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: calls
-- user_id is TEXT to match CTM's string-based agent IDs.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calls (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ctm_call_id      TEXT UNIQUE NOT NULL,
  user_id          TEXT NOT NULL,
  phone            TEXT,
  direction        TEXT,
  duration         INTEGER,
  status           TEXT,
  timestamp        TIMESTAMPTZ,
  caller_number    TEXT,
  tracking_number  TEXT,
  tracking_label   TEXT,
  source           TEXT,
  source_id        TEXT,
  agent_id         TEXT,
  agent_name       TEXT,
  recording_url    TEXT,
  transcript       TEXT,
  city             TEXT,
  state            TEXT,
  postal_code      TEXT,
  notes            TEXT,
  talk_time        INTEGER,
  wait_time        INTEGER,
  ring_time        INTEGER,
  score            INTEGER,
  sentiment        TEXT,
  summary          TEXT,
  tags             JSONB NOT NULL DEFAULT '[]'::jsonb,
  disposition      TEXT,
  rubric_results   JSONB,
  rubric_breakdown JSONB,
  synced_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS calls_user_id_idx     ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS calls_timestamp_idx   ON public.calls(timestamp DESC);
CREATE INDEX IF NOT EXISTS calls_ctm_call_id_idx ON public.calls(ctm_call_id);
CREATE INDEX IF NOT EXISTS calls_agent_id_idx    ON public.calls(agent_id);
CREATE INDEX IF NOT EXISTS calls_synced_at_idx   ON public.calls(synced_at DESC);
CREATE INDEX IF NOT EXISTS calls_score_idx       ON public.calls(score) WHERE score IS NOT NULL;
CREATE TRIGGER trg_calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: calls_sync_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calls_sync_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  calls_synced INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'completed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calls_sync_log_user_id ON public.calls_sync_log(user_id);

-- ============================================================
-- TABLE: live_analysis_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.live_analysis_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  call_id               TEXT,
  call_phone            TEXT,
  call_direction        TEXT,
  call_timestamp        TIMESTAMPTZ,
  suggested_disposition TEXT,
  insights              JSONB,
  transcript_preview    TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_live_analysis_logs_user_id    ON public.live_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_live_analysis_logs_call_id    ON public.live_analysis_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_live_analysis_logs_created_at ON public.live_analysis_logs(created_at DESC);

-- ============================================================
-- TABLE: notes_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id    TEXT NOT NULL,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notes      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_log_call_id    ON public.notes_log(call_id);
CREATE INDEX IF NOT EXISTS idx_notes_log_created_at ON public.notes_log(created_at DESC);

-- ============================================================
-- TABLE: call_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.call_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id    TEXT NOT NULL UNIQUE,
  notes      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_call_notes_call_id ON public.call_notes(call_id);
CREATE TRIGGER trg_call_notes_updated_at
  BEFORE UPDATE ON public.call_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: ctm_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ctm_assignments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ctm_agent_id      TEXT,
  ctm_user_group_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ctm_assignments_user_id ON public.ctm_assignments(user_id);
CREATE TRIGGER trg_ctm_assignments_updated_at
  BEFORE UPDATE ON public.ctm_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: qa_overrides
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qa_overrides (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id      TEXT NOT NULL,
  ctm_call_id  TEXT,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  overrides    JSONB NOT NULL DEFAULT '[]'::jsonb,
  manual_score INTEGER,
  ai_score     INTEGER,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qa_overrides_call_id ON public.qa_overrides(call_id);
CREATE INDEX IF NOT EXISTS idx_qa_overrides_user_id ON public.qa_overrides(user_id);
CREATE TRIGGER trg_qa_overrides_updated_at
  BEFORE UPDATE ON public.qa_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: knowledge_base (pgvector RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category   TEXT,
  title      TEXT,
  content    TEXT,
  metadata   JSONB,
  embedding  vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category  ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON public.knowledge_base
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE TRIGGER trg_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: personal_access_tokens (Laravel Sanctum)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personal_access_tokens (
  id             BIGSERIAL PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id   UUID NOT NULL,
  name           VARCHAR(255) NOT NULL,
  token          VARCHAR(64) UNIQUE NOT NULL,
  abilities      TEXT,
  last_used_at   TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pat_tokenable
  ON public.personal_access_tokens(tokenable_type, tokenable_id);

-- ============================================================
-- VIEW: qa_analysis_view
-- ============================================================
CREATE OR REPLACE VIEW public.qa_analysis_view AS
  SELECT
    c.*,
    qo.manual_score,
    qo.overrides    AS qa_overrides,
    qo.notes        AS qa_notes,
    ap.name         AS agent_profile_name,
    ap.email        AS agent_profile_email
  FROM public.calls c
  LEFT JOIN public.qa_overrides  qo ON qo.call_id  = c.ctm_call_id
  LEFT JOIN public.agent_profiles ap ON ap.agent_id = c.agent_id;
