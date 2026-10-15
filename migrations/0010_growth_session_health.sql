ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS session_status VARCHAR(24) NOT NULL DEFAULT 'unknown';

ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ;

ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS connected_account_label TEXT;
