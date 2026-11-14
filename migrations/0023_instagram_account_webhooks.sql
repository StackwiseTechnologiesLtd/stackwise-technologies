ALTER TABLE instagram_accounts
  ADD COLUMN IF NOT EXISTS webhook_subscribed BOOLEAN NOT NULL DEFAULT false;