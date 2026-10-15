ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_links_paystack_reference
  ON payment_links(paystack_reference);
