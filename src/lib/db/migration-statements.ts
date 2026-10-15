/** Embedded migrations — Workers have no filesystem access at runtime. */

function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

const INIT_SQL = `
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
`;

const KPAY_IS_TEST_SQL = `
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS kpay_is_test BOOLEAN;
`;

const PAYMENT_AUDIT_LOGS_SQL = `
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id UUID PRIMARY KEY,
  payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  event VARCHAR(32) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_link ON payment_audit_logs(payment_link_id, created_at DESC);
`;

const PAYMENT_AUDIT_IP_GEO_SQL = `
ALTER TABLE payment_audit_logs ADD COLUMN IF NOT EXISTS ip_geo JSONB;
`;

const ALLOWED_PAYMENT_METHODS_SQL = `
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS allowed_payment_methods VARCHAR(20) NOT NULL DEFAULT 'BOTH';
`;

const MANUAL_PAYMENT_FIELDS_SQL = `
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_source VARCHAR(20);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS amount_received_usd NUMERIC(12, 2);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS amount_received_local NUMERIC(14, 2);
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS payment_notes TEXT;
`;

const PAYSTACK_REFERENCE_SQL = `
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
CREATE INDEX IF NOT EXISTS idx_payment_links_paystack_reference ON payment_links(paystack_reference);
`;

const MAINTENANCE_SUBSCRIPTIONS_SQL = `
CREATE TABLE IF NOT EXISTS maintenance_subscriptions (
  id UUID PRIMARY KEY,
  slug VARCHAR(32) UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'KES',
  amount_minor INTEGER NOT NULL,
  amount_usd NUMERIC(12, 2),
  exchange_rate NUMERIC(16, 8),
  interval VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  paystack_plan_code TEXT,
  paystack_subscription_code TEXT,
  paystack_customer_code TEXT,
  paystack_reference TEXT,
  gateway_url TEXT,
  sent_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_slug ON maintenance_subscriptions(slug);
CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_status ON maintenance_subscriptions(status);
CREATE TABLE IF NOT EXISTS subscription_charge_events (
  id UUID PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES maintenance_subscriptions(id) ON DELETE CASCADE,
  paystack_reference TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency VARCHAR(8) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_charge_reference ON subscription_charge_events(paystack_reference);
`;

const GROWTH_ENGINE_SQL = `
CREATE TABLE IF NOT EXISTS growth_icp_settings (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_platform_credentials (
  platform VARCHAR(16) PRIMARY KEY,
  cookie_ciphertext TEXT NOT NULL,
  cookie_iv TEXT NOT NULL,
  user_agent TEXT,
  display_label TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS growth_signals (
  id UUID PRIMARY KEY,
  platform VARCHAR(16) NOT NULL,
  source_url TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_profile_url TEXT,
  role_title TEXT,
  company_name TEXT,
  body_text TEXT NOT NULL,
  context_summary TEXT,
  raw_payload JSONB,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_signals_ingested ON growth_signals (ingested_at DESC);

CREATE TABLE IF NOT EXISTS growth_leads (
  id UUID PRIMARY KEY,
  signal_id UUID REFERENCES growth_signals(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role_title TEXT,
  company_name TEXT,
  profile_url TEXT,
  email TEXT,
  platform VARCHAR(16),
  icp_score SMALLINT NOT NULL DEFAULT 0,
  intent_score SMALLINT NOT NULL DEFAULT 0,
  composite_score SMALLINT NOT NULL DEFAULT 0,
  score_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  pipeline_status VARCHAR(32) NOT NULL DEFAULT 'new',
  feedback_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_leads_composite ON growth_leads (composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_growth_leads_status ON growth_leads (pipeline_status);

CREATE TABLE IF NOT EXISTS growth_drafts (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES growth_leads(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES growth_signals(id) ON DELETE SET NULL,
  platform VARCHAR(16) NOT NULL,
  draft_kind VARCHAR(16) NOT NULL DEFAULT 'reply',
  body_text TEXT NOT NULL,
  image_notes TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'pending_review',
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  publish_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_growth_drafts_status ON growth_drafts (status);
`;

const GROWTH_SESSION_HEALTH_SQL = `
ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS session_status VARCHAR(24) NOT NULL DEFAULT 'unknown';
ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ;
ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE growth_platform_credentials
  ADD COLUMN IF NOT EXISTS connected_account_label TEXT;
`;

const GROWTH_CONNECT_BROWSER_SESSIONS_SQL = `
CREATE TABLE IF NOT EXISTS growth_connect_browser_sessions (
  id UUID PRIMARY KEY,
  platform VARCHAR(16) NOT NULL,
  puppeteer_session_id TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'login',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_connect_browser_status
  ON growth_connect_browser_sessions (status, updated_at DESC);
`;

export const MIGRATION_STATEMENTS = [
  ...splitStatements(INIT_SQL),
  ...splitStatements(KPAY_IS_TEST_SQL),
  ...splitStatements(PAYMENT_AUDIT_LOGS_SQL),
  ...splitStatements(PAYMENT_AUDIT_IP_GEO_SQL),
  ...splitStatements(ALLOWED_PAYMENT_METHODS_SQL),
  ...splitStatements(MANUAL_PAYMENT_FIELDS_SQL),
  ...splitStatements(PAYSTACK_REFERENCE_SQL),
  ...splitStatements(MAINTENANCE_SUBSCRIPTIONS_SQL),
  ...splitStatements(GROWTH_ENGINE_SQL),
  ...splitStatements(GROWTH_SESSION_HEALTH_SQL),
  ...splitStatements(GROWTH_CONNECT_BROWSER_SESSIONS_SQL),
];
