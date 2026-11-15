ALTER TABLE instagram_accounts
  ADD COLUMN IF NOT EXISTS profile_synced_at TIMESTAMPTZ;