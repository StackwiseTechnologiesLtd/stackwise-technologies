import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import type {
  InstagramConversation,
  InstagramInboxMessage,
} from "@/lib/instagram/types";

async function ready() {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is required");
  await ensureSchema();
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

export async function listInstagramConversations(
  accountIds: string[] | null,
): Promise<InstagramConversation[]> {
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
    accountIds?.length
      ? await sql`
          SELECT id, account_id, participant_igsid, participant_username,
                 last_message_at, last_message_preview
          FROM instagram_conversations
          WHERE account_id = ANY(${accountIds}::uuid[])
          ORDER BY last_message_at DESC
          LIMIT 100
        `
      : await sql`
          SELECT id, account_id, participant_igsid, participant_username,
                 last_message_at, last_message_preview
          FROM instagram_conversations
          ORDER BY last_message_at DESC
          LIMIT 100
        `,
  );
  return rows.map((row) => ({
    id: row.id,
    accountId: row.account_id,
    participantIgsid: row.participant_igsid,
    participantUsername: row.participant_username,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
  }));
}

export async function listInstagramMessages(
  conversationId: string,
): Promise<InstagramInboxMessage[]> {
  await ready();
  const sql = getSql();
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
      WHERE conversation_id = ${conversationId}::uuid
      ORDER BY created_at ASC
      LIMIT 200
    `,
  );
  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction === "outbound" ? "outbound" : "inbound",
    externalMessageId: row.external_message_id,
    bodyText: row.body_text,
    deliveryId: row.delivery_id,
    sendStatus: row.send_status,
    errorDetail: row.error_detail,
    createdAt: row.created_at,
  }));
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
      SELECT id, account_id, participant_igsid, participant_username,
             last_message_at, last_message_preview
      FROM instagram_conversations
      WHERE account_id = ${input.accountId}::uuid
        AND participant_igsid = ${input.participantIgsid}
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
      SELECT id, account_id, participant_igsid, participant_username,
             last_message_at, last_message_preview
      FROM instagram_conversations
      WHERE id = ${conversationId}::uuid
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