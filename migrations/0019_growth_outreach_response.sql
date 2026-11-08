ALTER TABLE growth_outreach_items
  ADD COLUMN IF NOT EXISTS response_status VARCHAR(24) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS response_marked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_growth_outreach_items_response
  ON growth_outreach_items (response_status, sent_at DESC)
  WHERE status = 'sent';
