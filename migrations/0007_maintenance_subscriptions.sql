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

CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_slug
  ON maintenance_subscriptions(slug);
CREATE INDEX IF NOT EXISTS idx_maintenance_subscriptions_status
  ON maintenance_subscriptions(status);

CREATE TABLE IF NOT EXISTS subscription_charge_events (
  id UUID PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES maintenance_subscriptions(id) ON DELETE CASCADE,
  paystack_reference TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency VARCHAR(8) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_charge_reference
  ON subscription_charge_events(paystack_reference);
