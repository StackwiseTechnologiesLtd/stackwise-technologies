ALTER TABLE payment_audit_logs ADD COLUMN IF NOT EXISTS ip_geo JSONB;
