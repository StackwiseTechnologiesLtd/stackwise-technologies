CREATE TABLE IF NOT EXISTS admin_otps (
  id UUID PRIMARY KEY,
  subject_hash VARCHAR(64) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_otps_subject ON admin_otps(subject_hash);

CREATE TABLE IF NOT EXISTS otp_verify_attempts (
  subject_hash VARCHAR(64) PRIMARY KEY,
  failed_count INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_send_throttle (
  subject_hash VARCHAR(64) PRIMARY KEY,
  last_attempt_at TIMESTAMPTZ NULL,
  last_sent_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY,
  slug VARCHAR(32) UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'XAF',
  amount_usd NUMERIC(12, 2) NOT NULL,
  amount_local NUMERIC(14, 2) NOT NULL,
  exchange_rate NUMERIC(16, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  line_items JSONB NOT NULL,
  notes TEXT,
  kpay_payment_id TEXT,
  kpay_reference TEXT,
  gateway_url TEXT,
  invoice_number VARCHAR(32) UNIQUE NOT NULL,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  receipt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_created ON payment_links(created_at DESC);
