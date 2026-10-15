CREATE TABLE IF NOT EXISTS growth_connect_browser_sessions (
  id UUID PRIMARY KEY,
  platform VARCHAR(16) NOT NULL,
  puppeteer_session_id TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'login',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_connect_browser_status
  ON growth_connect_browser_sessions (status, updated_at DESC);
