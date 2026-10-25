CREATE TABLE IF NOT EXISTS brand_portal_members (
  id UUID PRIMARY KEY,
  brand_slug VARCHAR(64) NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NULL,
  auth_method VARCHAR(16) NOT NULL DEFAULT 'password',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_slug, email)
);

CREATE INDEX IF NOT EXISTS idx_brand_portal_members_slug
  ON brand_portal_members (brand_slug, active);
