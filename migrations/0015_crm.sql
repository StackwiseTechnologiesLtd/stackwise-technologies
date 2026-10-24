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
