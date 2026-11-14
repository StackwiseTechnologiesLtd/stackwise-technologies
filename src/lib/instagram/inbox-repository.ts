import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import type {
  InstagramContactThread,
  InstagramConversation,
  InstagramInboxMessage,
} from "@/lib/instagram/types";

async function ready() {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is required");
  await ensureSchema();
}

function campaignThreadScopeSql(restrictAccounts: boolean, accountIds: string[] | null) {
  return {
    restrictAccounts,
    accountIds: accountIds ?? [],
  };
}

export async function recordInboundInstagramMessage(input: {
  accountId: string;
  participantIgsid: string;
  participantUsername?: string | null;
  externalMessageId: string;
  bodyText: string;
}): Promise<void> {
  await ready();
  const sql = getSql();
  const preview = input.bodyText.slice(0, 280);

  const existing = asRows<{ id: string }>(
    await sql`
      SELECT id FROM instagram_conversations
      WHERE account_id = ${input.accountId}::uuid
        AND participant_igsid = ${input.participantIgsid}
      LIMIT 1
    `,
  );
  const conversationId = existing[0]?.id ?? crypto.randomUUID();

  if (existing[0]) {
    await sql`
      UPDATE instagram_conversations SET
        participant_username = COALESCE(${input.participantUsername ?? null}, participant_username),
        last_message_at = NOW(),
        last_message_preview = ${preview},
        updated_at = NOW()
      WHERE id = ${conversationId}::uuid
    `;
  } else {
    await sql`
      INSERT INTO instagram_conversations (
        id, account_id, participant_igsid, participant_username,
        last_message_at, last_message_preview
      ) VALUES (
        ${conversationId}::uuid,
        ${input.accountId}::uuid,
        ${input.participantIgsid},
        ${input.participantUsername ?? null},
        NOW(),
        ${preview}
      )
    `;
  }

  const dup = asRows<{ id: string }>(
    await sql`
      SELECT id FROM instagram_messages
      WHERE conversation_id = ${conversationId}::uuid
        AND external_message_id = ${input.externalMessageId}
      LIMIT 1
    `,
  );
  if (dup[0]) return;

  await sql`
    INSERT INTO instagram_messages (
      id, conversation_id, direction, external_message_id, body_text
    ) VALUES (
      ${crypto.randomUUID()}::uuid,
      ${conversationId}::uuid,
      'inbound',
      ${input.externalMessageId},
      ${input.bodyText}
    )
  `;
}

export async function recordOutboundInstagramMessage(input: {
  accountId: string;
  participantIgsid: string;
  participantUsername?: string | null;
  bodyText: string;
  externalMessageId?: string | null;
  deliveryId?: string | null;
  sendStatus?: string | null;
  errorDetail?: string | null;
}): Promise<void> {
  await ready();
  const sql = getSql();
  const preview = input.bodyText.slice(0, 280);

  const existing = asRows<{ id: string }>(
    await sql`
      SELECT id FROM instagram_conversations
      WHERE account_id = ${input.accountId}::uuid
        AND participant_igsid = ${input.participantIgsid}
      LIMIT 1
    `,
  );
  const conversationId = existing[0]?.id ?? crypto.randomUUID();

  if (existing[0]) {
    await sql`
      UPDATE instagram_conversations SET
        participant_username = COALESCE(${input.participantUsername ?? null}, participant_username),
        last_message_at = NOW(),
        last_message_preview = ${preview},
        updated_at = NOW()
      WHERE id = ${conversationId}::uuid
    `;
  } else {
    await sql`
      INSERT INTO instagram_conversations (
        id, account_id, participant_igsid, participant_username,
        last_message_at, last_message_preview
      ) VALUES (
        ${conversationId}::uuid,
        ${input.accountId}::uuid,
        ${input.participantIgsid},
        ${input.participantUsername ?? null},
        NOW(),
        ${preview}
      )
    `;
  }

  await sql`
    INSERT INTO instagram_messages (
      id, conversation_id, direction, external_message_id, body_text,
      delivery_id, send_status, error_detail
    ) VALUES (
      ${crypto.randomUUID()}::uuid,
      ${conversationId}::uuid,
      'outbound',
      ${input.externalMessageId ?? null},
      ${input.bodyText},
      ${input.deliveryId ?? null}::uuid,
      ${input.sendStatus ?? null},
      ${input.errorDetail ?? null}
    )
  `;
}

export async function listInstagramContactThreads(input: {
  accountIds: string[] | null;
  limit?: number;
  offset?: number;
  search?: string | null;
}): Promise<{ threads: InstagramContactThread[]; total: number }> {
  await ready();
  const sql = getSql();
  const limit = Math.min(input.limit ?? 25, 100);
  const offset = Math.max(0, input.offset ?? 0);
  const scope = campaignThreadScopeSql(input.accountIds != null, input.accountIds);
  const q = input.search?.trim().toLowerCase() || null;
  const qPattern = q ? `%${q.replace(/%/g, "")}%` : null;

  const countRows = asRows<{ total: number }>(
    await sql`
      WITH eligible AS (
        SELECT c.id, c.account_id, c.participant_igsid, c.participant_username,
               c.last_message_at, c.last_message_preview
        FROM instagram_conversations c
        WHERE (
          NOT ${scope.restrictAccounts}::boolean
          OR c.account_id = ANY(${scope.accountIds}::uuid[])
        )
          AND EXISTS (
            SELECT 1 FROM instagram_deliveries d
            WHERE d.account_id = c.account_id
              AND d.recipient_igsid = c.participant_igsid
              AND d.campaign_id IS NOT NULL
          )
      ),
      grouped AS (
        SELECT
          account_id,
          CASE
            WHEN participant_username IS NOT NULL AND BTRIM(participant_username) <> ''
            THEN LOWER(BTRIM(participant_username))
            ELSE 'igsid:' || participant_igsid
          END AS contact_key,
          (ARRAY_AGG(id ORDER BY last_message_at DESC))[1] AS primary_id,
          (ARRAY_AGG(participant_igsid ORDER BY last_message_at DESC))[1] AS primary_igsid,
          MAX(participant_username) FILTER (WHERE participant_username IS NOT NULL) AS participant_username,
          MAX(last_message_at) AS last_message_at,
          (ARRAY_AGG(last_message_preview ORDER BY last_message_at DESC))[1] AS last_message_preview,
          ARRAY_AGG(id ORDER BY last_message_at DESC) AS conversation_ids
        FROM eligible
        GROUP BY account_id, contact_key
      )
      SELECT COUNT(*)::int AS total
      FROM grouped g
      WHERE (
        ${qPattern}::text IS NULL
        OR g.contact_key ILIKE ${qPattern}
        OR g.participant_username ILIKE ${qPattern}
        OR g.primary_igsid ILIKE ${qPattern}
      )
    `,
  );
  const total = countRows[0]?.total ?? 0;

  const rows = asRows<{
    primary_id: string;
    account_id: string;
    primary_igsid: string;
    participant_username: string | null;
    last_message_at: string;
    last_message_preview: string | null;
    conversation_ids: string[];
  }>(
    await sql`
      WITH eligible AS (
        SELECT c.id, c.account_id, c.participant_igsid, c.participant_username,
               c.last_message_at, c.last_message_preview
        FROM instagram_conversations c
        WHERE (
          NOT ${scope.restrictAccounts}::boolean
          OR c.account_id = ANY(${scope.accountIds}::uuid[])
        )
          AND EXISTS (
            SELECT 1 FROM instagram_deliveries d
            WHERE d.account_id = c.account_id
              AND d.recipient_igsid = c.participant_igsid
              AND d.campaign_id IS NOT NULL
          )
      ),
      grouped AS (
        SELECT
          account_id,
          CASE
            WHEN participant_username IS NOT NULL AND BTRIM(participant_username) <> ''
            THEN LOWER(BTRIM(participant_username))
            ELSE 'igsid:' || participant_igsid
          END AS contact_key,
          (ARRAY_AGG(id ORDER BY last_message_at DESC))[1] AS primary_id,
          (ARRAY_AGG(participant_igsid ORDER BY last_message_at DESC))[1] AS primary_igsid,
          MAX(participant_username) FILTER (WHERE participant_username IS NOT NULL) AS participant_username,
          MAX(last_message_at) AS last_message_at,
          (ARRAY_AGG(last_message_preview ORDER BY last_message_at DESC))[1] AS last_message_preview,
          ARRAY_AGG(id ORDER BY last_message_at DESC) AS conversation_ids
        FROM eligible
        GROUP BY account_id, contact_key
      )
      SELECT
        primary_id, account_id, primary_igsid, participant_username,
        last_message_at, last_message_preview, conversation_ids
      FROM grouped g
      WHERE (
        ${qPattern}::text IS NULL
        OR g.contact_key ILIKE ${qPattern}
        OR g.participant_username ILIKE ${qPattern}
        OR g.primary_igsid ILIKE ${qPattern}
      )
      ORDER BY last_message_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
  );

  return {
    total,
    threads: rows.map((row) => ({
      id: row.primary_id,
      accountId: row.account_id,
      participantIgsid: row.primary_igsid,
      participantUsername: row.participant_username,
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview,
      conversationIds: row.conversation_ids,
    })),
  };
}

export async function listInstagramConversations(input: {
  accountIds: string[] | null;
  limit?: number;
  offset?: number;
}): Promise<{ conversations: InstagramConversation[]; total: number }> {
  await ready();
  const sql = getSql();
  const limit = Math.min(input.limit ?? 25, 100);
  const offset = Math.max(0, input.offset ?? 0);
  const scope = campaignThreadScopeSql(input.accountIds != null, input.accountIds);

  const countRows = asRows<{ total: number }>(
    await sql`
      SELECT COUNT(*)::int AS total
      FROM instagram_conversations c
      WHERE (
        NOT ${scope.restrictAccounts}::boolean
        OR c.account_id = ANY(${scope.accountIds}::uuid[])
      )
        AND EXISTS (
          SELECT 1 FROM instagram_deliveries d
          WHERE d.account_id = c.account_id
            AND d.recipient_igsid = c.participant_igsid
            AND d.campaign_id IS NOT NULL
        )
    `,
  );
  const total = countRows[0]?.total ?? 0;

  const rows = asRows<{
    id: string;
    account_id: string;
    participant_igsid: string;
    participant_username: string | null;
    last_message_at: string;
    last_message_preview: string | null;
  }>(
    await sql`
      SELECT c.id, c.account_id, c.participant_igsid, c.participant_username,
             c.last_message_at, c.last_message_preview
      FROM instagram_conversations c
      WHERE (
        NOT ${scope.restrictAccounts}::boolean
        OR c.account_id = ANY(${scope.accountIds}::uuid[])
      )
        AND EXISTS (
          SELECT 1 FROM instagram_deliveries d
          WHERE d.account_id = c.account_id
            AND d.recipient_igsid = c.participant_igsid
            AND d.campaign_id IS NOT NULL
        )
      ORDER BY c.last_message_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
  );
  return {
    total,
    conversations: rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      participantIgsid: row.participant_igsid,
      participantUsername: row.participant_username,
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview,
    })),
  };
}

export async function resolveContactConversationIds(
  conversationId: string,
): Promise<string[]> {
  const conv = await getInstagramConversation(conversationId);
  if (!conv) return [];

  await ready();
  const sql = getSql();
  const username = conv.participantUsername?.trim();

  if (username) {
    const rows = asRows<{ id: string }>(
      await sql`
        SELECT c.id
        FROM instagram_conversations c
        WHERE c.account_id = ${conv.accountId}::uuid
          AND LOWER(BTRIM(c.participant_username)) = ${username.toLowerCase()}
          AND EXISTS (
            SELECT 1 FROM instagram_deliveries d
            WHERE d.account_id = c.account_id
              AND d.recipient_igsid = c.participant_igsid
              AND d.campaign_id IS NOT NULL
          )
      `,
    );
    return rows.map((r) => r.id);
  }

  return [conv.id];
}

export async function listInstagramMessages(
  conversationId: string,
  input?: { limit?: number; offset?: number },
): Promise<{ messages: InstagramInboxMessage[]; total: number }> {
  await ready();
  const sql = getSql();
  const limit = Math.min(input?.limit ?? 50, 200);
  const offset = Math.max(0, input?.offset ?? 0);
  const conversationIds = await resolveContactConversationIds(conversationId);
  if (conversationIds.length === 0) {
    return { messages: [], total: 0 };
  }

  const countRows = asRows<{ total: number }>(
    await sql`
      SELECT COUNT(*)::int AS total
      FROM instagram_messages
      WHERE conversation_id = ANY(${conversationIds}::uuid[])
    `,
  );
  const total = countRows[0]?.total ?? 0;

  const rows = asRows<{
    id: string;
    conversation_id: string;
    direction: string;
    external_message_id: string | null;
    body_text: string | null;
    delivery_id: string | null;
    send_status: string | null;
    error_detail: string | null;
    created_at: string;
  }>(
    await sql`
      SELECT id, conversation_id, direction, external_message_id, body_text,
             delivery_id, send_status, error_detail, created_at
      FROM instagram_messages
      WHERE conversation_id = ANY(${conversationIds}::uuid[])
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
  );
  const chronological = [...rows].reverse();
  return {
    total,
    messages: chronological.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      direction: row.direction === "outbound" ? "outbound" : "inbound",
      externalMessageId: row.external_message_id,
      bodyText: row.body_text,
      deliveryId: row.delivery_id,
      sendStatus: row.send_status,
      errorDetail: row.error_detail,
      createdAt: row.created_at,
    })),
  };
}

export async function findInstagramConversationByParticipant(input: {
  accountId: string;
  participantIgsid: string;
}): Promise<InstagramConversation | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    account_id: string;
    participant_igsid: string;
    participant_username: string | null;
    last_message_at: string;
    last_message_preview: string | null;
  }>(
    await sql`
      SELECT c.id, c.account_id, c.participant_igsid, c.participant_username,
             c.last_message_at, c.last_message_preview
      FROM instagram_conversations c
      WHERE c.account_id = ${input.accountId}::uuid
        AND c.participant_igsid = ${input.participantIgsid}
        AND EXISTS (
          SELECT 1 FROM instagram_deliveries d
          WHERE d.account_id = c.account_id
            AND d.recipient_igsid = c.participant_igsid
            AND d.campaign_id IS NOT NULL
        )
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    participantIgsid: row.participant_igsid,
    participantUsername: row.participant_username,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
  };
}

export async function getInstagramConversation(
  conversationId: string,
): Promise<InstagramConversation | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    account_id: string;
    participant_igsid: string;
    participant_username: string | null;
    last_message_at: string;
    last_message_preview: string | null;
  }>(
    await sql`
      SELECT c.id, c.account_id, c.participant_igsid, c.participant_username,
             c.last_message_at, c.last_message_preview
      FROM instagram_conversations c
      WHERE c.id = ${conversationId}::uuid
        AND EXISTS (
          SELECT 1 FROM instagram_deliveries d
          WHERE d.account_id = c.account_id
            AND d.recipient_igsid = c.participant_igsid
            AND d.campaign_id IS NOT NULL
        )
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    participantIgsid: row.participant_igsid,
    participantUsername: row.participant_username,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
  };
}