CREATE TABLE IF NOT EXISTS growth_outreach_runs (
  id UUID PRIMARY KEY,
  status VARCHAR(24) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS growth_outreach_items (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES growth_outreach_runs(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES growth_leads(id) ON DELETE SET NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  company_name TEXT,
  profile_url TEXT,
  subject_line TEXT NOT NULL,
  body_text TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  used_ai BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_outreach_items_run
  ON growth_outreach_items (run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_growth_outreach_runs_started
  ON growth_outreach_runs (started_at DESC);
