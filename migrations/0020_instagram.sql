CREATE TABLE IF NOT EXISTS instagram_meta_apps (
  id UUID PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  label TEXT NOT NULL,
  meta_app_id VARCHAR(32) NOT NULL,
  app_secret_ciphertext TEXT NOT NULL,
  app_secret_iv TEXT NOT NULL,
  webhook_verify_token VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY,
  meta_app_id UUID NOT NULL REFERENCES instagram_meta_apps(id) ON DELETE CASCADE,
  ig_user_id VARCHAR(64) NOT NULL,
  username TEXT,
  access_token_ciphertext TEXT,
  access_token_iv TEXT,
  token_expires_at TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meta_app_id, ig_user_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_accounts_ig_user
  ON instagram_accounts (ig_user_id);

CREATE TABLE IF NOT EXISTS instagram_campaigns (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  media_id VARCHAR(64) NOT NULL,
  keyword VARCHAR(64) NOT NULL,
  private_reply_template TEXT NOT NULL,
  public_reply_template TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_campaigns_account_media
  ON instagram_campaigns (account_id, media_id)
  WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS instagram_deliveries (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES instagram_campaigns(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL,
  skip_reason VARCHAR(64),
  trigger_type VARCHAR(24) NOT NULL DEFAULT 'comment',
  trigger_external_id VARCHAR(128) NOT NULL,
  recipient_igsid VARCHAR(64),
  recipient_username TEXT,
  trigger_text TEXT,
  private_reply_preview TEXT,
  meta_message_id TEXT,
  error_detail TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_instagram_deliveries_trigger_external
  ON instagram_deliveries (trigger_external_id);

CREATE INDEX IF NOT EXISTS idx_instagram_deliveries_status_created
  ON instagram_deliveries (status, created_at DESC);

CREATE TABLE IF NOT EXISTS instagram_webhook_receipts (
  id UUID PRIMARY KEY,
  meta_app_id UUID REFERENCES instagram_meta_apps(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_webhook_receipts_received
  ON instagram_webhook_receipts (received_at DESC);