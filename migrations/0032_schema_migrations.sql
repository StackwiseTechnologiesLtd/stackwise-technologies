-- Stackwise SQL migration history (applied_at recorded by scripts/migrate.mjs).
-- Named stackwise_* to avoid clashing with legacy Rails schema_migrations(version) on shared Neon DBs.
CREATE TABLE IF NOT EXISTS stackwise_schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_stackwise_schema_migrations_applied_at
  ON stackwise_schema_migrations (applied_at DESC);