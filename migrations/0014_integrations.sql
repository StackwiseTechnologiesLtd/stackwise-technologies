ALTER TABLE growth_signals
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(32) NOT NULL DEFAULT 'harvest';

ALTER TABLE growth_leads
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(32) NOT NULL DEFAULT 'harvest';

CREATE INDEX IF NOT EXISTS idx_growth_signals_lead_source
  ON growth_signals (lead_source, ingested_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_leads_lead_source
  ON growth_leads (lead_source, created_at DESC);

CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY,
  lead_source VARCHAR(32) NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  lead_id UUID REFERENCES growth_leads(id) ON DELETE SET NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_events_source_created
  ON integration_events (lead_source, created_at DESC);
