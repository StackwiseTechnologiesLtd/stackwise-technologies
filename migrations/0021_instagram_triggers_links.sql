ALTER TABLE instagram_campaigns
  ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(24) NOT NULL DEFAULT 'comment',
  ADD COLUMN IF NOT EXISTS button_label_1 TEXT,
  ADD COLUMN IF NOT EXISTS button_url_1 TEXT,
  ADD COLUMN IF NOT EXISTS button_label_2 TEXT,
  ADD COLUMN IF NOT EXISTS button_url_2 TEXT;

ALTER TABLE instagram_campaigns
  ALTER COLUMN media_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS instagram_tracked_links (
  token VARCHAR(48) PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES instagram_deliveries(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES instagram_campaigns(id) ON DELETE SET NULL,
  label TEXT,
  target_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_tracked_links_delivery
  ON instagram_tracked_links (delivery_id);

CREATE TABLE IF NOT EXISTS instagram_link_clicks (
  id UUID PRIMARY KEY,
  link_token VARCHAR(48) NOT NULL REFERENCES instagram_tracked_links(token) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_instagram_link_clicks_token
  ON instagram_link_clicks (link_token, clicked_at DESC);