CREATE TABLE IF NOT EXISTS agency_projects (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  crm_opportunity_id UUID UNIQUE REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  contract_engagement_id UUID REFERENCES contract_engagements(id) ON DELETE SET NULL,
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_projects_status
  ON agency_projects (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS agency_project_milestones (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_project_milestones_project
  ON agency_project_milestones (project_id, sort_order, due_at NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_agency_project_milestones_due
  ON agency_project_milestones (due_at)
  WHERE completed_at IS NULL;