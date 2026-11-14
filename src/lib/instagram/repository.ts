import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { decryptJson, encryptJson } from "@/lib/growth/crypto";
import type {
  InstagramAccount,
  InstagramCampaign,
  InstagramCampaignTrigger,
  InstagramDelivery,
  InstagramDeliveryMetrics,
  InstagramDeliveryStatus,
  InstagramMetaApp,
  InstagramOpsStatus,
} from "@/lib/instagram/types";
import { isInstagramDryRun } from "@/lib/instagram/graph-send";
import { instagramMetaRegistrationUrls } from "@/lib/instagram/public-endpoints";
import { instagramCampaignTriggers } from "@/lib/instagram/types";

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

type MetaAppSecretRow = {
  id: string;
  slug: string;
  label: string;
  meta_app_id: string;
  app_secret_ciphertext: string;
  app_secret_iv: string;
  facebook_app_secret_ciphertext: string | null;
  facebook_app_secret_iv: string | null;
  webhook_verify_token: string;
  created_at: string;
  updated_at: string;
};

async function getMetaAppWithSecret(
  row: MetaAppSecretRow,
): Promise<InstagramMetaApp & { appSecret: string; facebookAppSecret: string | null }> {
  const secret = await decryptJson<{ secret: string }>(
    row.app_secret_ciphertext,
    row.app_secret_iv,
  );
  let facebookAppSecret: string | null = null;
  if (row.facebook_app_secret_ciphertext && row.facebook_app_secret_iv) {
    const fb = await decryptJson<{ secret: string }>(
      row.facebook_app_secret_ciphertext,
      row.facebook_app_secret_iv,
    );
    facebookAppSecret = fb.secret;
  }
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    metaAppId: row.meta_app_id,
    webhookVerifyToken: row.webhook_verify_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    appSecret: secret.secret,
    facebookAppSecret,
  };
}

export async function getMetaAppById(
  id: string,
): Promise<(InstagramMetaApp & { appSecret: string; facebookAppSecret: string | null }) | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<MetaAppSecretRow>(
    await sql`
      SELECT id, slug, label, meta_app_id, app_secret_ciphertext, app_secret_iv,
             facebook_app_secret_ciphertext, facebook_app_secret_iv,
             webhook_verify_token, created_at, updated_at
      FROM instagram_meta_apps
      WHERE id = ${id}::uuid
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return getMetaAppWithSecret(row);
}

export async function getMetaAppBySlug(
  slug: string,
): Promise<(InstagramMetaApp & { appSecret: string; facebookAppSecret: string | null }) | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<MetaAppSecretRow>(
    await sql`
      SELECT id, slug, label, meta_app_id, app_secret_ciphertext, app_secret_iv,
             facebook_app_secret_ciphertext, facebook_app_secret_iv,
             webhook_verify_token, created_at, updated_at
      FROM instagram_meta_apps
      WHERE slug = ${slug}
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return getMetaAppWithSecret(row);
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
  facebookAppSecret?: string;
  webhookVerifyToken: string;
  slug?: string;
}): Promise<InstagramMetaApp> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const slug = input.slug?.trim() || slugify(input.label) || `app-${id.slice(0, 8)}`;
  const enc = await encryptJson({ secret: input.appSecret.trim() });
  let facebook_app_secret_ciphertext: string | null = null;
  let facebook_app_secret_iv: string | null = null;
  if (input.facebookAppSecret?.trim()) {
    const fbEnc = await encryptJson({ secret: input.facebookAppSecret.trim() });
    facebook_app_secret_ciphertext = fbEnc.ciphertext;
    facebook_app_secret_iv = fbEnc.iv;
  }
  await sql`
    INSERT INTO instagram_meta_apps (
      id, slug, label, meta_app_id, app_secret_ciphertext, app_secret_iv,
      facebook_app_secret_ciphertext, facebook_app_secret_iv, webhook_verify_token
    ) VALUES (
      ${id}::uuid,
      ${slug},
      ${input.label.trim()},
      ${input.metaAppId.trim()},
      ${enc.ciphertext},
      ${enc.iv},
      ${facebook_app_secret_ciphertext},
      ${facebook_app_secret_iv},
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
    webhook_subscribed: boolean;
    created_at: string;
    updated_at: string;
  }>(
    await sql`
      SELECT id, meta_app_id, ig_user_id, username, status, token_expires_at,
             access_token_ciphertext, webhook_subscribed, created_at, updated_at
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
    webhookSubscribed: row.webhook_subscribed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertAccount(input: {
  metaAppId: string;
  igUserId: string;
  username?: string | null;
  accessToken?: string;
  tokenExpiresAt?: string | null;
  webhookSubscribed?: boolean;
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
        token_expires_at = COALESCE(${input.tokenExpiresAt ?? null}::timestamptz, token_expires_at),
        webhook_subscribed = COALESCE(${input.webhookSubscribed ?? null}, webhook_subscribed),
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
        access_token_ciphertext, access_token_iv, token_expires_at,
        webhook_subscribed, status
      ) VALUES (
        ${id}::uuid,
        ${input.metaAppId}::uuid,
        ${input.igUserId.trim()},
        ${input.username ?? null},
        ${access_token_ciphertext},
        ${access_token_iv},
        ${input.tokenExpiresAt ?? null}::timestamptz,
        ${input.webhookSubscribed ?? false},
        'active'
      )
    `;
  }

  const row = (await listAccounts()).find((a) => a.id === id);
  if (!row) throw new Error("Account upsert failed");
  return row;
}

export async function getAccountIgUserId(accountId: string): Promise<string | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ ig_user_id: string }>(
    await sql`
      SELECT ig_user_id FROM instagram_accounts
      WHERE id = ${accountId}::uuid
      LIMIT 1
    `,
  );
  return rows[0]?.ig_user_id ?? null;
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

type CampaignRow = {
  id: string;
  account_id: string;
  name: string;
  media_id: string | null;
  keyword: string;
  trigger_type: string;
  private_reply_template: string;
  public_reply_template: string | null;
  button_label_1: string | null;
  button_url_1: string | null;
  button_label_2: string | null;
  button_url_2: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function mapCampaign(row: CampaignRow): InstagramCampaign {
  const trigger = instagramCampaignTriggers.includes(
    row.trigger_type as InstagramCampaignTrigger,
  )
    ? (row.trigger_type as InstagramCampaignTrigger)
    : "comment";
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    mediaId: row.media_id,
    keyword: row.keyword,
    triggerType: trigger,
    privateReplyTemplate: row.private_reply_template,
    publicReplyTemplate: row.public_reply_template,
    buttonLabel1: row.button_label_1,
    buttonUrl1: row.button_url_1,
    buttonLabel2: row.button_label_2,
    buttonUrl2: row.button_url_2,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCampaigns(accountId?: string): Promise<InstagramCampaign[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<CampaignRow>(
    accountId
      ? await sql`
          SELECT id, account_id, name, media_id, keyword, trigger_type,
                 private_reply_template, public_reply_template,
                 button_label_1, button_url_1, button_label_2, button_url_2,
                 active, created_at, updated_at
          FROM instagram_campaigns
          WHERE account_id = ${accountId}::uuid
          ORDER BY updated_at DESC
        `
      : await sql`
          SELECT id, account_id, name, media_id, keyword, trigger_type,
                 private_reply_template, public_reply_template,
                 button_label_1, button_url_1, button_label_2, button_url_2,
                 active, created_at, updated_at
          FROM instagram_campaigns
          ORDER BY updated_at DESC
        `,
  );
  return rows.map(mapCampaign);
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
  mediaId?: string | null;
  keyword: string;
  triggerType?: InstagramCampaignTrigger;
  privateReplyTemplate: string;
  publicReplyTemplate?: string | null;
  buttonLabel1?: string | null;
  buttonUrl1?: string | null;
  buttonLabel2?: string | null;
  buttonUrl2?: string | null;
  active?: boolean;
}): Promise<InstagramCampaign> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const trigger = input.triggerType ?? "comment";
  const media =
    input.mediaId?.trim() ||
    (trigger === "comment" ? "" : null);
  await sql`
    INSERT INTO instagram_campaigns (
      id, account_id, name, media_id, keyword, trigger_type,
      private_reply_template, public_reply_template,
      button_label_1, button_url_1, button_label_2, button_url_2,
      active
    ) VALUES (
      ${id}::uuid,
      ${input.accountId}::uuid,
      ${input.name.trim()},
      ${media || null},
      ${input.keyword.trim()},
      ${trigger},
      ${input.privateReplyTemplate},
      ${input.publicReplyTemplate ?? null},
      ${input.buttonLabel1 ?? null},
      ${input.buttonUrl1 ?? null},
      ${input.buttonLabel2 ?? null},
      ${input.buttonUrl2 ?? null},
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

export async function deleteCampaign(id: string): Promise<boolean> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ id: string }>(
    await sql`
      DELETE FROM instagram_campaigns
      WHERE id = ${id}::uuid
      RETURNING id
    `,
  );
  return rows.length > 0;
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
  triggerType?: string;
}): Promise<string> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const campaignId = input.campaignId;
  if (campaignId) {
    await sql`
      INSERT INTO instagram_deliveries (
        id, campaign_id, account_id, status, skip_reason,
        trigger_type, trigger_external_id, recipient_igsid, recipient_username,
        trigger_text, private_reply_preview, error_detail
      ) VALUES (
        ${id}::uuid,
        ${campaignId}::uuid,
        ${input.accountId}::uuid,
        ${input.status},
        ${input.skipReason ?? null},
        ${input.triggerType ?? "comment"},
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
        trigger_type, trigger_external_id, recipient_igsid, recipient_username,
        trigger_text, private_reply_preview, error_detail
      ) VALUES (
        ${id}::uuid,
        NULL,
        ${input.accountId}::uuid,
        ${input.status},
        ${input.skipReason ?? null},
        ${input.triggerType ?? "comment"},
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
    media_id: string | null;
    keyword: string | null;
    trigger_type_campaign: string | null;
    button_label_1: string | null;
    button_url_1: string | null;
    button_label_2: string | null;
    button_url_2: string | null;
    click_count: number;
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
        c.active AS campaign_active,
        c.media_id,
        c.keyword,
        c.trigger_type AS trigger_type_campaign,
        c.button_label_1,
        c.button_url_1,
        c.button_label_2,
        c.button_url_2,
        (
          SELECT COUNT(*)::int FROM instagram_link_clicks lc
          INNER JOIN instagram_tracked_links tl ON tl.token = lc.link_token
          WHERE tl.delivery_id = d.id
        ) AS click_count
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
    clickCount: row.click_count ?? 0,
  };

  let campaign: InstagramCampaign | null = null;
  if (row.campaign_id && row.private_reply_template) {
    const trigger = instagramCampaignTriggers.includes(
      (row.trigger_type_campaign ?? "comment") as InstagramCampaignTrigger,
    )
      ? (row.trigger_type_campaign as InstagramCampaignTrigger)
      : "comment";
    campaign = {
      id: row.campaign_id,
      accountId: row.account_id,
      name: row.campaign_name ?? "",
      mediaId: row.media_id,
      keyword: row.keyword ?? "",
      triggerType: trigger,
      privateReplyTemplate: row.private_reply_template,
      publicReplyTemplate: row.public_reply_template,
      buttonLabel1: row.button_label_1,
      buttonUrl1: row.button_url_1,
      buttonLabel2: row.button_label_2,
      buttonUrl2: row.button_url_2,
      active: Boolean(row.campaign_active),
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  }

  return { delivery, campaign };
}

type DeliveryListRow = {
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
  click_count: number;
};

function mapDeliveryRow(row: DeliveryListRow): InstagramDelivery {
  return {
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
    clickCount: row.click_count ?? 0,
  };
}

export async function listDeliveries(input?: {
  status?: InstagramDeliveryStatus;
  campaignId?: string;
  limit?: number;
  offset?: number;
  accountIds?: string[] | null;
}): Promise<{ deliveries: InstagramDelivery[]; total: number }> {
  await ready();
  const sql = getSql();
  const limit = Math.min(input?.limit ?? 50, 200);
  const offset = Math.max(0, input?.offset ?? 0);
  const status = input?.status ?? null;
  const campaignId = input?.campaignId ?? null;
  const scopeAccounts = input?.accountIds;
  const restrictAccounts = scopeAccounts != null;

  const countRows = asRows<{ total: number }>(
    await sql`
      SELECT COUNT(*)::int AS total
      FROM instagram_deliveries d
      WHERE (${status}::text IS NULL OR d.status = ${status})
        AND (${campaignId}::uuid IS NULL OR d.campaign_id = ${campaignId}::uuid)
        AND (
          NOT ${restrictAccounts}::boolean
          OR d.account_id = ANY(${scopeAccounts ?? []}::uuid[])
        )
    `,
  );
  const total = countRows[0]?.total ?? 0;

  const rows = asRows<DeliveryListRow>(
    await sql`
      SELECT d.*, c.name AS campaign_name,
        (
          SELECT COUNT(*)::int FROM instagram_link_clicks lc
          INNER JOIN instagram_tracked_links tl ON tl.token = lc.link_token
          WHERE tl.delivery_id = d.id
        ) AS click_count
      FROM instagram_deliveries d
      LEFT JOIN instagram_campaigns c ON c.id = d.campaign_id
      WHERE (${status}::text IS NULL OR d.status = ${status})
        AND (${campaignId}::uuid IS NULL OR d.campaign_id = ${campaignId}::uuid)
        AND (
          NOT ${restrictAccounts}::boolean
          OR d.account_id = ANY(${scopeAccounts ?? []}::uuid[])
        )
      ORDER BY d.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
  );

  return {
    deliveries: rows.map(mapDeliveryRow),
    total,
  };
}

export async function hasInstagramCampaignParticipant(
  accountId: string,
  participantIgsid: string,
): Promise<boolean> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ ok: boolean }>(
    await sql`
      SELECT EXISTS (
        SELECT 1 FROM instagram_deliveries d
        WHERE d.account_id = ${accountId}::uuid
          AND d.recipient_igsid = ${participantIgsid}
          AND d.campaign_id IS NOT NULL
      ) AS ok
    `,
  );
  return Boolean(rows[0]?.ok);
}

export async function countRecentAccountDeliveries(
  accountId: string,
  windowSeconds: number,
): Promise<number> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ count: number }>(
    await sql`
      SELECT COUNT(*)::int AS count
      FROM instagram_deliveries
      WHERE account_id = ${accountId}::uuid
        AND created_at > NOW() - (${windowSeconds} * INTERVAL '1 second')
        AND status IN ('queued', 'sent')
    `,
  );
  return rows[0]?.count ?? 0;
}

export function trackedLinkBaseUrl(): string {
  return (
    process.env.INSTAGRAM_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function createTrackedLinks(input: {
  deliveryId: string;
  campaignId: string;
  baseUrl: string;
  buttons: { label: string; url: string }[];
}): Promise<{ token: string; label: string }[]> {
  await ready();
  const sql = getSql();
  const out: { token: string; label: string }[] = [];
  for (const btn of input.buttons) {
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    await sql`
      INSERT INTO instagram_tracked_links (
        token, delivery_id, campaign_id, label, target_url
      ) VALUES (
        ${token},
        ${input.deliveryId}::uuid,
        ${input.campaignId}::uuid,
        ${btn.label},
        ${btn.url}
      )
    `;
    out.push({ token, label: btn.label });
  }
  return out;
}

export async function getTrackedLinkTarget(
  token: string,
): Promise<{ targetUrl: string } | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ target_url: string }>(
    await sql`
      SELECT target_url FROM instagram_tracked_links
      WHERE token = ${token}
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return { targetUrl: row.target_url };
}

export async function recordTrackedLinkClick(
  token: string,
  userAgent: string | null,
): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`
    INSERT INTO instagram_link_clicks (id, link_token, user_agent)
    VALUES (${crypto.randomUUID()}::uuid, ${token}, ${userAgent})
  `;
}

export async function recordWebhookReceipt(metaAppId: string | null): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`
    INSERT INTO instagram_webhook_receipts (id, meta_app_id)
    VALUES (${crypto.randomUUID()}::uuid, ${metaAppId}::uuid)
  `;
}

export async function getInstagramOpsStatus(input?: {
  accountIds?: string[] | null;
}): Promise<InstagramOpsStatus> {
  await ready();
  const sql = getSql();
  const scopeAccounts = input?.accountIds;
  const restrictAccounts = scopeAccounts != null;
  const counts = asRows<{
    meta_apps: number;
    accounts: number;
    campaigns: number;
  }>(
    restrictAccounts
      ? await sql`
          SELECT
            (SELECT COUNT(*)::int FROM instagram_meta_apps) AS meta_apps,
            (
              SELECT COUNT(*)::int FROM instagram_accounts
              WHERE status = 'active' AND id = ANY(${scopeAccounts ?? []}::uuid[])
            ) AS accounts,
            (
              SELECT COUNT(*)::int FROM instagram_campaigns
              WHERE active = TRUE AND account_id = ANY(${scopeAccounts ?? []}::uuid[])
            ) AS campaigns
        `
      : await sql`
          SELECT
            (SELECT COUNT(*)::int FROM instagram_meta_apps) AS meta_apps,
            (SELECT COUNT(*)::int FROM instagram_accounts WHERE status = 'active') AS accounts,
            (SELECT COUNT(*)::int FROM instagram_campaigns WHERE active = TRUE) AS campaigns
        `,
  );
  const times = asRows<{ last_webhook: string | null; last_send: string | null }>(
    restrictAccounts
      ? await sql`
          SELECT
            (SELECT MAX(received_at) FROM instagram_webhook_receipts) AS last_webhook,
            (
              SELECT MAX(sent_at) FROM instagram_deliveries
              WHERE status = 'sent'
                AND account_id = ANY(${scopeAccounts ?? []}::uuid[])
            ) AS last_send
        `
      : await sql`
          SELECT
            (SELECT MAX(received_at) FROM instagram_webhook_receipts) AS last_webhook,
            (SELECT MAX(sent_at) FROM instagram_deliveries WHERE status = 'sent') AS last_send
        `,
  );
  const { webhookUrlPattern } = instagramMetaRegistrationUrls();
  return {
    metaAppCount: restrictAccounts ? 0 : counts[0]?.meta_apps ?? 0,
    connectedAccounts: counts[0]?.accounts ?? 0,
    activeCampaigns: counts[0]?.campaigns ?? 0,
    lastWebhookAt: times[0]?.last_webhook ?? null,
    lastSendAt: times[0]?.last_send ?? null,
    dryRunMode: isInstagramDryRun(),
    webhookUrlPattern,
  };
}

export async function getInstagramDeliveryMetrics(input?: {
  accountIds?: string[] | null;
}): Promise<InstagramDeliveryMetrics> {
  await ready();
  const sql = getSql();
  const scopeAccounts = input?.accountIds;
  const restrictAccounts = scopeAccounts != null;

  const rows = asRows<{
    sent_week: number;
    failed_week: number;
    queued: number;
    paused: number;
  }>(
    restrictAccounts
      ? await sql`
          SELECT
            (
              SELECT COUNT(*)::int FROM instagram_deliveries
              WHERE status = 'sent'
                AND sent_at > NOW() - INTERVAL '7 days'
                AND account_id = ANY(${scopeAccounts ?? []}::uuid[])
            ) AS sent_week,
            (
              SELECT COUNT(*)::int FROM instagram_deliveries
              WHERE status = 'failed'
                AND created_at > NOW() - INTERVAL '7 days'
                AND account_id = ANY(${scopeAccounts ?? []}::uuid[])
            ) AS failed_week,
            (
              SELECT COUNT(*)::int FROM instagram_deliveries
              WHERE status = 'queued'
                AND account_id = ANY(${scopeAccounts ?? []}::uuid[])
            ) AS queued,
            (
              SELECT COUNT(*)::int FROM instagram_campaigns
              WHERE active = FALSE
                AND account_id = ANY(${scopeAccounts ?? []}::uuid[])
            ) AS paused
        `
      : await sql`
          SELECT
            (
              SELECT COUNT(*)::int FROM instagram_deliveries
              WHERE status = 'sent'
                AND sent_at > NOW() - INTERVAL '7 days'
            ) AS sent_week,
            (
              SELECT COUNT(*)::int FROM instagram_deliveries
              WHERE status = 'failed'
                AND created_at > NOW() - INTERVAL '7 days'
            ) AS failed_week,
            (
              SELECT COUNT(*)::int FROM instagram_deliveries
              WHERE status = 'queued'
            ) AS queued,
            (
              SELECT COUNT(*)::int FROM instagram_campaigns
              WHERE active = FALSE
            ) AS paused
        `,
  );
  const row = rows[0];
  return {
    sentThisWeek: row?.sent_week ?? 0,
    failedThisWeek: row?.failed_week ?? 0,
    queuedNow: row?.queued ?? 0,
    pausedCampaigns: row?.paused ?? 0,
  };
}