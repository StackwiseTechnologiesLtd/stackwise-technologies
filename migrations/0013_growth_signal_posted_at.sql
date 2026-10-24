ALTER TABLE growth_signals
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_growth_signals_posted
  ON growth_signals (posted_at DESC NULLS LAST);
