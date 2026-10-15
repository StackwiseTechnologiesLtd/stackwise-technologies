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
