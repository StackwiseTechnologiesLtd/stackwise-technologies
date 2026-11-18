CREATE TABLE IF NOT EXISTS crm_job_applications (
  id UUID PRIMARY KEY,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  growth_lead_id UUID REFERENCES growth_leads(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  response_status TEXT NOT NULL DEFAULT 'pending',
  employer_label TEXT,
  role_title TEXT,
  source_post_url TEXT,
  apply_url TEXT,
  reply_preview TEXT,
  outcome_notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_applied
  ON crm_job_applications (applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_opportunity
  ON crm_job_applications (opportunity_id, applied_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_dedupe
  ON crm_job_applications (
    COALESCE(opportunity_id::text, ''),
    channel,
    COALESCE(source_post_url, '')
  );