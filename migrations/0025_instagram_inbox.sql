CREATE TABLE IF NOT EXISTS instagram_conversations (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  participant_igsid VARCHAR(64) NOT NULL,
  participant_username TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, participant_igsid)
);

CREATE INDEX IF NOT EXISTS idx_instagram_conversations_account_updated
  ON instagram_conversations (account_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS instagram_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES instagram_conversations(id) ON DELETE CASCADE,
  direction VARCHAR(8) NOT NULL,
  external_message_id TEXT,
  body_text TEXT,
  delivery_id UUID REFERENCES instagram_deliveries(id) ON DELETE SET NULL,
  send_status VARCHAR(24),
  error_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_messages_conversation
  ON instagram_messages (conversation_id, created_at ASC);