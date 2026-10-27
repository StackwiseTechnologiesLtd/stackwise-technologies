CREATE TABLE IF NOT EXISTS brand_guidelines (
  slug VARCHAR(64) PRIMARY KEY,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_guidelines_published
  ON brand_guidelines (published, slug);

CREATE TABLE IF NOT EXISTS brand_guideline_assets (
  brand_slug VARCHAR(64) NOT NULL REFERENCES brand_guidelines (slug) ON DELETE CASCADE,
  asset_path TEXT NOT NULL,
  content_type VARCHAR(128) NOT NULL,
  data BYTEA NOT NULL,
  byte_size INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_slug, asset_path)
);

CREATE INDEX IF NOT EXISTS idx_brand_guideline_assets_slug
  ON brand_guideline_assets (brand_slug);
