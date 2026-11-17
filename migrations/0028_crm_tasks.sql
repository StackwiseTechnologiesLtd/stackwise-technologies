CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_opportunity
  ON crm_tasks (opportunity_id, completed_at NULLS FIRST, due_at NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_open_due
  ON crm_tasks (due_at)
  WHERE completed_at IS NULL;