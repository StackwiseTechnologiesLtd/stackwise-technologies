CREATE TABLE IF NOT EXISTS growth_icp_settings (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_platform_credentials (
  platform VARCHAR(16) PRIMARY KEY,
  cookie_ciphertext TEXT NOT NULL,
  cookie_iv TEXT NOT NULL,
  user_agent TEXT,
  display_label TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS growth_signals (
  id UUID PRIMARY KEY,
  platform VARCHAR(16) NOT NULL,
  source_url TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_profile_url TEXT,
  role_title TEXT,
  company_name TEXT,
  body_text TEXT NOT NULL,
  context_summary TEXT,
  raw_payload JSONB,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_signals_ingested ON growth_signals (ingested_at DESC);

CREATE TABLE IF NOT EXISTS growth_leads (
  id UUID PRIMARY KEY,
  signal_id UUID REFERENCES growth_signals(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role_title TEXT,
  company_name TEXT,
  profile_url TEXT,
  email TEXT,
  platform VARCHAR(16),
  icp_score SMALLINT NOT NULL DEFAULT 0,
  intent_score SMALLINT NOT NULL DEFAULT 0,
  composite_score SMALLINT NOT NULL DEFAULT 0,
  score_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  pipeline_status VARCHAR(32) NOT NULL DEFAULT 'new',
  feedback_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_leads_composite ON growth_leads (composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_growth_leads_status ON growth_leads (pipeline_status);

CREATE TABLE IF NOT EXISTS growth_drafts (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES growth_leads(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES growth_signals(id) ON DELETE SET NULL,
  platform VARCHAR(16) NOT NULL,
  draft_kind VARCHAR(16) NOT NULL DEFAULT 'reply',
  body_text TEXT NOT NULL,
  image_notes TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'pending_review',
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  publish_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_growth_drafts_status ON growth_drafts (status);
