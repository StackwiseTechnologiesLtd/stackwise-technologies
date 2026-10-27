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

const GROWTH_LEAD_PROFILE_SQL = `
ALTER TABLE growth_leads
  ADD COLUMN IF NOT EXISTS profile_summary TEXT;
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

const CONTRACT_ENGAGEMENTS_SQL = `
CREATE TABLE IF NOT EXISTS contract_engagements (
  id UUID PRIMARY KEY,
  slug VARCHAR(32) NOT NULL UNIQUE,
  reference VARCHAR(24) NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  document_kind VARCHAR(24) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  company_name TEXT,
  lead_id UUID REFERENCES growth_leads(id) ON DELETE SET NULL,
  services_brief TEXT NOT NULL,
  commercial_notes TEXT,
  body_markdown TEXT NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT 'GENERATING',
  generation_error TEXT,
  client_feedback TEXT,
  client_feedback_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_engagements_status ON contract_engagements (status);
CREATE INDEX IF NOT EXISTS idx_contract_engagements_created ON contract_engagements (created_at DESC);
`;

const CONTRACT_ENGAGEMENTS_V2_SQL = `
ALTER TABLE contract_engagements
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE contract_engagements
  ADD COLUMN IF NOT EXISTS accepted_by_name TEXT;
ALTER TABLE contract_engagements
  ADD COLUMN IF NOT EXISTS delivery_phase VARCHAR(16) NOT NULL DEFAULT 'agreement';
ALTER TABLE contract_engagements
  ADD COLUMN IF NOT EXISTS progress_headline TEXT;
ALTER TABLE contract_engagements
  ADD COLUMN IF NOT EXISTS progress_detail TEXT;
ALTER TABLE contract_engagements
  ADD COLUMN IF NOT EXISTS milestones JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE payment_links
  ADD COLUMN IF NOT EXISTS contract_engagement_id UUID REFERENCES contract_engagements(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payment_links_contract_engagement
  ON payment_links (contract_engagement_id);
`;

const INTEGRATIONS_SQL = `
ALTER TABLE growth_signals
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(32) NOT NULL DEFAULT 'harvest';
ALTER TABLE growth_leads
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(32) NOT NULL DEFAULT 'harvest';
CREATE INDEX IF NOT EXISTS idx_growth_signals_lead_source
  ON growth_signals (lead_source, ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_leads_lead_source
  ON growth_leads (lead_source, created_at DESC);
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY,
  lead_source VARCHAR(32) NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  lead_id UUID REFERENCES growth_leads(id) ON DELETE SET NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_integration_events_source_created
  ON integration_events (lead_source, created_at DESC);
`;

const CRM_SQL = `
CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  growth_lead_id UUID REFERENCES growth_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_people (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  role_title TEXT,
  linkedin_url TEXT,
  x_profile_url TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  growth_lead_id UUID UNIQUE REFERENCES growth_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  stage VARCHAR(32) NOT NULL DEFAULT 'new',
  amount_cents INTEGER,
  fit_score INTEGER NOT NULL DEFAULT 0,
  source_post_url TEXT,
  platform VARCHAR(16),
  lead_source VARCHAR(32),
  person_id UUID NOT NULL REFERENCES crm_people(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  growth_lead_id UUID UNIQUE REFERENCES growth_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  activity_type VARCHAR(32) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage
  ON crm_opportunities (stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opportunity
  ON crm_activities (opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_people_growth_lead
  ON crm_people (growth_lead_id);
`;

const GROWTH_SIGNAL_POSTED_AT_SQL = `
ALTER TABLE growth_signals
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_growth_signals_posted
  ON growth_signals (posted_at DESC NULLS LAST);
`;

const BRAND_GUIDELINES_SQL = `
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
`;

const BRAND_PORTAL_SQL = `
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
  ...splitStatements(GROWTH_LEAD_PROFILE_SQL),
  ...splitStatements(GROWTH_CONNECT_BROWSER_SESSIONS_SQL),
  ...splitStatements(CONTRACT_ENGAGEMENTS_SQL),
  ...splitStatements(CONTRACT_ENGAGEMENTS_V2_SQL),
  ...splitStatements(GROWTH_SIGNAL_POSTED_AT_SQL),
  ...splitStatements(INTEGRATIONS_SQL),
  ...splitStatements(CRM_SQL),
  ...splitStatements(BRAND_PORTAL_SQL),
  ...splitStatements(BRAND_GUIDELINES_SQL),
];
