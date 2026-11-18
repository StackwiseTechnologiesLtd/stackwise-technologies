CREATE TABLE IF NOT EXISTS content_calendar_posts (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  scheduled_on DATE NOT NULL,
  scheduled_time VARCHAR(5),
  channel VARCHAR(32) NOT NULL DEFAULT 'instagram',
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  script TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  accent VARCHAR(7) NOT NULL DEFAULT '#e85d8a',
  project_id UUID REFERENCES agency_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_posts_scheduled
  ON content_calendar_posts (scheduled_on DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_calendar_posts_project
  ON content_calendar_posts (project_id, scheduled_on DESC)
  WHERE project_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS content_calendar_assets (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES content_calendar_posts(id) ON DELETE CASCADE,
  r2_key TEXT,
  content_type VARCHAR(128) NOT NULL,
  filename TEXT NOT NULL,
  byte_size INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  dev_data BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_assets_post
  ON content_calendar_assets (post_id, sort_order ASC, created_at ASC);