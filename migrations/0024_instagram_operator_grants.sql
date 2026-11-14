CREATE TABLE IF NOT EXISTS instagram_operator_grants (
  id UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  label TEXT,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(320)
);

CREATE INDEX IF NOT EXISTS idx_instagram_operator_grants_account
  ON instagram_operator_grants (instagram_account_id);