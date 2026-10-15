ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_source VARCHAR(20);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS amount_received_usd NUMERIC(12, 2);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS amount_received_local NUMERIC(14, 2);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_notes TEXT;
