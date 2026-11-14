import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { decryptJson, encryptJson } from "@/lib/growth/crypto";
import type {
  InstagramAccount,
  InstagramCampaign,
  InstagramDelivery,
  InstagramDeliveryStatus,
  InstagramMetaApp,
  InstagramOpsStatus,
} from "@/lib/instagram/types";

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required");
  }
  await ensureSchema();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export async function getMetaAppBySlug(
  slug: string,
): Promise<(InstagramMetaApp & { appSecret: string }) | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    slug: string;
    label: string;
    meta_app_id: string;
    app_secret_ciphertext: string;
    app_secret_iv: string;
    webhook_verify_token: string;
    created_at: string;
    updated_at: string;
  }>(
    await sql`
      SELECT id, slug, label, meta_app_id, app_secret_ciphertext, app_secret_iv,
             webhook_verify_token, created_at, updated_at
      FROM instagram_meta_apps
      WHERE slug = ${slug}
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  const secret = await decryptJson<{ secret: string }>(
    row.app_secret_ciphertext,
    row.app_secret_iv,
  );
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    metaAppId: row.meta_app_id,
    webhookVerifyToken: row.webhook_verify_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    appSecret: secret.secret,
  };
}

export async function listMetaApps(): Promise<InstagramMetaApp[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    slug: string;
    label: string;
    meta_app_id: string;
    webhook_verify_token: string;
    created_at: string;
    updated_at: string;
  }>(
    await sql`
      SELECT id, slug, label, meta_app_id, webhook_verify_token, created_at, updated_at
      FROM instagram_meta_apps
      ORDER BY label ASC
    `,
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.label,
    metaAppId: row.meta_app_id,
    webhookVerifyToken: row.webhook_verify_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createMetaApp(input: {
  label: string;
  metaAppId: string;
  appSecret: string;
  webhookVerifyToken: string;
  slug?: string;
}): Promise<InstagramMetaApp> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const slug = input.slug?.trim() || slugify(input.label) || `app-${id.slice(0, 8)}`;
  const enc = await encryptJson({ secret: input.appSecret.trim() });
  await sql`
    INSERT INTO instagram_meta_apps (
      id, slug, label, meta_app_id, app_secret_ciphertext, app_secret_iv, webhook_verify_token
    ) VALUES (
      ${id}::uuid,
      ${slug},
      ${input.label.trim()},
      ${input.metaAppId.trim()},
      ${enc.ciphertext},
      ${enc.iv},
      ${input.webhookVerifyToken.trim()}
    )
  `;
  const created = (await listMetaApps()).find((a) => a.id === id);
  if (!created) throw new Error("Create meta app failed");
  return created;
}

export async function listAccounts(): Promise<InstagramAccount[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    meta_app_id: string;
    ig_user_id: string;
    username: string | null;
    status: string;
    token_expires_at: string | null;
    access_token_ciphertext: string | null;
    created_at: string;
    updated_at: string;
  }>(
    await sql`
      SELECT id, meta_app_id, ig_user_id, username, status, token_expires_at,
             access_token_ciphertext, created_at, updated_at
      FROM instagram_accounts
      ORDER BY username ASC NULLS LAST, created_at DESC
    `,
  );
  return rows.map((row) => ({
    id: row.id,
    metaAppId: row.meta_app_id,
    igUserId: row.ig_user_id,
    username: row.username,
    status: row.status,
    tokenExpiresAt: row.token_expires_at,
    hasAccessToken: Boolean(row.access_token_ciphertext),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertAccount(input: {
  metaAppId: string;
  igUserId: string;
  username?: string | null;
  accessToken?: string;
}): Promise<InstagramAccount> {
  await ready();
  const sql = getSql();
  const existing = asRows<{ id: string }>(
    await sql`
      SELECT id FROM instagram_accounts
      WHERE meta_app_id = ${input.metaAppId}::uuid AND ig_user_id = ${input.igUserId}
      LIMIT 1
    `,
  );
  const id = existing[0]?.id ?? crypto.randomUUID();
  let access_token_ciphertext: string | null = null;
  let access_token_iv: string | null = null;
  if (input.accessToken?.trim()) {
    const enc = await encryptJson({ token: input.accessToken.trim() });
    access_token_ciphertext = enc.ciphertext;
    access_token_iv = enc.iv;
  }

  if (existing[0]) {
    await sql`
      UPDATE instagram_accounts SET
        username = COALESCE(${input.username ?? null}, username),
        access_token_ciphertext = COALESCE(${access_token_ciphertext}, access_token_ciphertext),
        access_token_iv = COALESCE(${access_token_iv}, access_token_iv),
        status = 'active',
        updated_at = NOW()
      WHERE id = ${id}::uuid
    `;
  } else {
    if (!access_token_ciphertext || !access_token_iv) {
      throw new Error("accessToken required for new account");
    }
    await sql`
      INSERT INTO instagram_accounts (
        id, meta_app_id, ig_user_id, username,
        access_token_ciphertext, access_token_iv, status
      ) VALUES (
        ${id}::uuid,
        ${input.metaAppId}::uuid,
        ${input.igUserId.trim()},
        ${input.username ?? null},
        ${access_token_ciphertext},
        ${access_token_iv},
        'active'
      )
    `;
  }

  const row = (await listAccounts()).find((a) => a.id === id);
  if (!row) throw new Error("Account upsert failed");
  return row;
}

export async function getAccountAccessToken(
  accountId: string,
): Promise<string | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    access_token_ciphertext: string | null;
    access_token_iv: string | null;
  }>(
    await sql`
      SELECT access_token_ciphertext, access_token_iv
      FROM instagram_accounts
      WHERE id = ${accountId}::uuid AND status = 'active'
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row?.access_token_ciphertext || !row.access_token_iv) return null;
  const payload = await decryptJson<{ token: string }>(
    row.access_token_ciphertext,
    row.access_token_iv,
  );
  return payload.token;
}

export async function findAccountByIgUserId(
  igUserId: string,
): Promise<InstagramAccount | null> {
  const accounts = await listAccounts();
  return accounts.find((a) => a.igUserId === igUserId && a.status === "active") ?? null;
}

export async function listCampaigns(accountId?: string): Promise<InstagramCampaign[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    account_id: string;
    name: string;
    media_id: string;
    keyword: string;
    private_reply_template: string;
    public_reply_template: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
  }>(
    accountId
      ? await sql`
          SELECT id, account_id, name, media_id, keyword, private_reply_template,
                 public_reply_template, active, created_at, updated_at
          FROM instagram_campaigns
          WHERE account_id = ${accountId}::uuid
          ORDER BY updated_at DESC
        `
      : await sql`
          SELECT id, account_id, name, media_id, keyword, private_reply_template,
                 public_reply_template, active, created_at, updated_at
          FROM instagram_campaigns
          ORDER BY updated_at DESC
        `,
  );
  return rows.map((row) => ({
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    mediaId: row.media_id,
    keyword: row.keyword,
    privateReplyTemplate: row.private_reply_template,
    publicReplyTemplate: row.public_reply_template,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function findActiveCampaignForMedia(input: {
  accountId: string;
  mediaId: string;
}): Promise<InstagramCampaign[]> {
  const all = await listCampaigns(input.accountId);
  return all.filter((c) => c.active && c.mediaId === input.mediaId);
}

export async function createCampaign(input: {
  accountId: string;
  name: string;
  mediaId: string;
  keyword: string;
  privateReplyTemplate: string;
  publicReplyTemplate?: string | null;
  active?: boolean;
}): Promise<InstagramCampaign> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO instagram_campaigns (
      id, account_id, name, media_id, keyword,
      private_reply_template, public_reply_template, active
    ) VALUES (
      ${id}::uuid,
      ${input.accountId}::uuid,
      ${input.name.trim()},
      ${input.mediaId.trim()},
      ${input.keyword.trim()},
      ${input.privateReplyTemplate},
      ${input.publicReplyTemplate ?? null},
      ${input.active ?? true}
    )
  `;
  const created = (await listCampaigns(input.accountId)).find((c) => c.id === id);
  if (!created) throw new Error("Create campaign failed");
  return created;
}

export async function patchCampaign(
  id: string,
  patch: { active?: boolean },
): Promise<InstagramCampaign | null> {
  await ready();
  const sql = getSql();
  if (patch.active !== undefined) {
    await sql`
      UPDATE instagram_campaigns
      SET active = ${patch.active}, updated_at = NOW()
      WHERE id = ${id}::uuid
    `;
  }
  return (await listCampaigns()).find((c) => c.id === id) ?? null;
}

export async function getDeliveryByTriggerId(
  triggerExternalId: string,
): Promise<{ id: string } | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ id: string }>(
    await sql`
      SELECT id FROM instagram_deliveries
      WHERE trigger_external_id = ${triggerExternalId}
      LIMIT 1
    `,
  );
  return rows[0] ?? null;
}

export async function insertDelivery(input: {
  campaignId: string | null;
  accountId: string;
  status: InstagramDeliveryStatus;
  skipReason?: string | null;
  triggerExternalId: string;
  recipientIgsid?: string | null;
  recipientUsername?: string | null;
  triggerText?: string | null;
  privateReplyPreview?: string | null;
  errorDetail?: string | null;
}): Promise<string> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const campaignId = input.campaignId;
  if (campaignId) {
    await sql`
      INSERT INTO instagram_deliveries (
        id, campaign_id, account_id, status, skip_reason,
        trigger_external_id, recipient_igsid, recipient_username,
        trigger_text, private_reply_preview, error_detail
      ) VALUES (
        ${id}::uuid,
        ${campaignId}::uuid,
        ${input.accountId}::uuid,
        ${input.status},
        ${input.skipReason ?? null},
        ${input.triggerExternalId},
        ${input.recipientIgsid ?? null},
        ${input.recipientUsername ?? null},
        ${input.triggerText ?? null},
        ${input.privateReplyPreview ?? null},
        ${input.errorDetail ?? null}
      )
    `;
  } else {
    await sql`
      INSERT INTO instagram_deliveries (
        id, campaign_id, account_id, status, skip_reason,
        trigger_external_id, recipient_igsid, recipient_username,
        trigger_text, private_reply_preview, error_detail
      ) VALUES (
        ${id}::uuid,
        NULL,
        ${input.accountId}::uuid,
        ${input.status},
        ${input.skipReason ?? null},
        ${input.triggerExternalId},
        ${input.recipientIgsid ?? null},
        ${input.recipientUsername ?? null},
        ${input.triggerText ?? null},
        ${input.privateReplyPreview ?? null},
        ${input.errorDetail ?? null}
      )
    `;
  }
  return id;
}

export async function updateDeliveryStatus(
  id: string,
  patch: {
    status: InstagramDeliveryStatus;
    skipReason?: string | null;
    metaMessageId?: string | null;
    errorDetail?: string | null;
    sentAt?: string | null;
  },
): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`
    UPDATE instagram_deliveries SET
      status = ${patch.status},
      skip_reason = COALESCE(${patch.skipReason ?? null}, skip_reason),
      meta_message_id = COALESCE(${patch.metaMessageId ?? null}, meta_message_id),
      error_detail = COALESCE(${patch.errorDetail ?? null}, error_detail),
      sent_at = COALESCE(${patch.sentAt ?? null}::timestamptz, sent_at)
    WHERE id = ${id}::uuid
  `;
}

export async function getDeliveryWithCampaign(deliveryId: string): Promise<{
  delivery: InstagramDelivery;
  campaign: InstagramCampaign | null;
} | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    id: string;
    campaign_id: string | null;
    account_id: string;
    status: string;
    skip_reason: string | null;
    trigger_type: string;
    trigger_external_id: string;
    recipient_igsid: string | null;
    recipient_username: string | null;
    trigger_text: string | null;
    private_reply_preview: string | null;
    meta_message_id: string | null;
    error_detail: string | null;
    queued_at: string;
    sent_at: string | null;
    created_at: string;
    campaign_name: string | null;
    private_reply_template: string | null;
    public_reply_template: string | null;
    campaign_active: boolean | null;
  }>(
    await sql`
      SELECT
        d.id, d.campaign_id, d.account_id, d.status, d.skip_reason,
        d.trigger_type, d.trigger_external_id, d.recipient_igsid,
        d.recipient_username, d.trigger_text, d.private_reply_preview,
        d.meta_message_id, d.error_detail, d.queued_at, d.sent_at, d.created_at,
        c.name AS campaign_name,
        c.private_reply_template,
        c.public_reply_template,
        c.active AS campaign_active
      FROM instagram_deliveries d
      LEFT JOIN instagram_campaigns c ON c.id = d.campaign_id
      WHERE d.id = ${deliveryId}::uuid
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;

  const delivery: InstagramDelivery = {
    id: row.id,
    campaignId: row.campaign_id,
    accountId: row.account_id,
    status: row.status as InstagramDeliveryStatus,
    skipReason: row.skip_reason,
    triggerType: row.trigger_type,
    triggerExternalId: row.trigger_external_id,
    recipientIgsid: row.recipient_igsid,
    recipientUsername: row.recipient_username,
    triggerText: row.trigger_text,
    privateReplyPreview: row.private_reply_preview,
    metaMessageId: row.meta_message_id,
    errorDetail: row.error_detail,
    queuedAt: row.queued_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    campaignName: row.campaign_name,
  };

  let campaign: InstagramCampaign | null = null;
  if (row.campaign_id && row.private_reply_template) {
    campaign = {
      id: row.campaign_id,
      accountId: row.account_id,
      name: row.campaign_name ?? "",
      mediaId: "",
      keyword: "",
      privateReplyTemplate: row.private_reply_template,
      publicReplyTemplate: row.public_reply_template,
      active: Boolean(row.campaign_active),
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  }

  return { delivery, campaign };
}

export async function listDeliveries(input?: {
  status?: InstagramDeliveryStatus;
  campaignId?: string;
  limit?: number;
}): Promise<InstagramDelivery[]> {
  await ready();
  const sql = getSql();
  const limit = Math.min(input?.limit ?? 50, 200);

  const rows = asRows<{
    id: string;
    campaign_id: string | null;
    account_id: string;
    status: string;
    skip_reason: string | null;
    trigger_type: string;
    trigger_external_id: string;
    recipient_igsid: string | null;
    recipient_username: string | null;
    trigger_text: string | null;
    private_reply_preview: string | null;
    meta_message_id: string | null;
    error_detail: string | null;
    queued_at: string;
    sent_at: string | null;
    created_at: string;
    campaign_name: string | null;
  }>(
    input?.status && input.campaignId
      ? await sql`
          SELECT d.*, c.name AS campaign_name
          FROM instagram_deliveries d
          LEFT JOIN instagram_campaigns c ON c.id = d.campaign_id
          WHERE d.status = ${input.status} AND d.campaign_id = ${input.campaignId}::uuid
          ORDER BY d.created_at DESC
          LIMIT ${limit}
        `
      : input?.status
        ? await sql`
            SELECT d.*, c.name AS campaign_name
            FROM instagram_deliveries d
            LEFT JOIN instagram_campaigns c ON c.id = d.campaign_id
            WHERE d.status = ${input.status}
            ORDER BY d.created_at DESC
            LIMIT ${limit}
          `
        : input?.campaignId
          ? await sql`
              SELECT d.*, c.name AS campaign_name
              FROM instagram_deliveries d
              LEFT JOIN instagram_campaigns c ON c.id = d.campaign_id
              WHERE d.campaign_id = ${input.campaignId}::uuid
              ORDER BY d.created_at DESC
              LIMIT ${limit}
            `
          : await sql`
              SELECT d.*, c.name AS campaign_name
              FROM instagram_deliveries d
              LEFT JOIN instagram_campaigns c ON c.id = d.campaign_id
              ORDER BY d.created_at DESC
              LIMIT ${limit}
            `,
  );

  return rows.map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    accountId: row.account_id,
    status: row.status as InstagramDeliveryStatus,
    skipReason: row.skip_reason,
    triggerType: row.trigger_type,
    triggerExternalId: row.trigger_external_id,
    recipientIgsid: row.recipient_igsid,
    recipientUsername: row.recipient_username,
    triggerText: row.trigger_text,
    privateReplyPreview: row.private_reply_preview,
    metaMessageId: row.meta_message_id,
    errorDetail: row.error_detail,
    queuedAt: row.queued_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    campaignName: row.campaign_name,
  }));
}

export async function recordWebhookReceipt(metaAppId: string | null): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`
    INSERT INTO instagram_webhook_receipts (id, meta_app_id)
    VALUES (${crypto.randomUUID()}::uuid, ${metaAppId}::uuid)
  `;
}

export async function getInstagramOpsStatus(): Promise<InstagramOpsStatus> {
  await ready();
  const sql = getSql();
  const counts = asRows<{
    meta_apps: number;
    accounts: number;
    campaigns: number;
  }>(
    await sql`
      SELECT
        (SELECT COUNT(*)::int FROM instagram_meta_apps) AS meta_apps,
        (SELECT COUNT(*)::int FROM instagram_accounts WHERE status = 'active') AS accounts,
        (SELECT COUNT(*)::int FROM instagram_campaigns WHERE active = TRUE) AS campaigns
    `,
  );
  const times = asRows<{ last_webhook: string | null; last_send: string | null }>(
    await sql`
      SELECT
        (SELECT MAX(received_at) FROM instagram_webhook_receipts) AS last_webhook,
        (SELECT MAX(sent_at) FROM instagram_deliveries WHERE status = 'sent') AS last_send
    `,
  );
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://stackwisetechnologies.com";
  return {
    metaAppCount: counts[0]?.meta_apps ?? 0,
    connectedAccounts: counts[0]?.accounts ?? 0,
    activeCampaigns: counts[0]?.campaigns ?? 0,
    lastWebhookAt: times[0]?.last_webhook ?? null,
    lastSendAt: times[0]?.last_send ?? null,
    webhookUrlPattern: `${base}/api/webhooks/meta/{appSlug}`,
  };
}