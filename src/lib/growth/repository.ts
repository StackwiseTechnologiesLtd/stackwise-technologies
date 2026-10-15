import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { decryptJson, encryptJson } from "@/lib/growth/crypto";
import { isDevConnectRuntimeEnabled } from "@/lib/growth/dev-connect-runtime";
import { buildPersonalizedReplyDraft } from "@/lib/growth/personalized-draft";
import { DEFAULT_ICP_CONFIG } from "@/lib/growth/icp-default";
import { publishXReplyWithPlaywright } from "@/lib/growth/publish-x-reply";
import { scoreLead } from "@/lib/growth/scoring";
import type { Cookie } from "playwright";
import type {
  GrowthDraft,
  GrowthInboxItem,
  GrowthLead,
  GrowthPlatform,
  GrowthSignal,
  IcpConfig,
  IngestSignalInput,
  PlatformCredentialStatus,
  PipelineStatus,
  SessionStatus,
} from "@/lib/growth/types";

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for the growth engine");
  }
  await ensureSchema();
}

type SignalRow = {
  id: string;
  platform: string;
  source_url: string | null;
  author_name: string | null;
  author_handle: string | null;
  author_profile_url: string | null;
  role_title: string | null;
  company_name: string | null;
  body_text: string;
  context_summary: string | null;
  ingested_at: string;
};

type LeadRow = {
  id: string;
  signal_id: string | null;
  full_name: string;
  role_title: string | null;
  company_name: string | null;
  profile_url: string | null;
  email: string | null;
  platform: string | null;
  icp_score: number;
  intent_score: number;
  composite_score: number;
  score_reasons: string[] | string;
  pipeline_status: string;
  feedback_note: string | null;
  profile_summary: string | null;
  created_at: string;
  updated_at: string;
};

type DraftRow = {
  id: string;
  lead_id: string | null;
  signal_id: string | null;
  platform: string;
  draft_kind: string;
  body_text: string;
  image_notes: string | null;
  status: string;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  publish_error: string | null;
};

function mapSignal(row: SignalRow): GrowthSignal {
  return {
    id: row.id,
    platform: row.platform as GrowthPlatform,
    sourceUrl: row.source_url,
    authorName: row.author_name,
    authorHandle: row.author_handle,
    authorProfileUrl: row.author_profile_url,
    roleTitle: row.role_title,
    companyName: row.company_name,
    bodyText: row.body_text,
    contextSummary: row.context_summary,
    ingestedAt: row.ingested_at,
  };
}

function parseReasons(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapLead(row: LeadRow): GrowthLead {
  return {
    id: row.id,
    signalId: row.signal_id,
    fullName: row.full_name,
    roleTitle: row.role_title,
    companyName: row.company_name,
    profileUrl: row.profile_url,
    email: row.email,
    platform: (row.platform as GrowthPlatform) ?? null,
    icpScore: row.icp_score,
    intentScore: row.intent_score,
    compositeScore: row.composite_score,
    scoreReasons: parseReasons(row.score_reasons),
    pipelineStatus: row.pipeline_status as PipelineStatus,
    feedbackNote: row.feedback_note,
    profileSummary: row.profile_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDraft(row: DraftRow): GrowthDraft {
  return {
    id: row.id,
    leadId: row.lead_id,
    signalId: row.signal_id,
    platform: row.platform as GrowthPlatform,
    draftKind: row.draft_kind as GrowthDraft["draftKind"],
    bodyText: row.body_text,
    imageNotes: row.image_notes,
    status: row.status as GrowthDraft["status"],
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    publishError: row.publish_error,
  };
}

export async function getIcpConfig(): Promise<IcpConfig> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ config: IcpConfig }>(
    await sql`SELECT config FROM growth_icp_settings WHERE id = 'default' LIMIT 1`,
  );
  if (rows[0]?.config) return rows[0].config;
  await sql`
    INSERT INTO growth_icp_settings (id, config, updated_at)
    VALUES ('default', ${JSON.stringify(DEFAULT_ICP_CONFIG)}::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING
  `;
  return DEFAULT_ICP_CONFIG;
}

export async function saveIcpConfig(config: IcpConfig): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`
    INSERT INTO growth_icp_settings (id, config, updated_at)
    VALUES ('default', ${JSON.stringify(config)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET
      config = EXCLUDED.config,
      updated_at = NOW()
  `;
}

export async function ingestSignal(
  input: IngestSignalInput,
): Promise<{ signal: GrowthSignal; lead: GrowthLead; draft: GrowthDraft | null }> {
  await ready();
  const sql = getSql();
  const config = await getIcpConfig();
  const signalId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const now = new Date().toISOString();

  const scored = scoreLead({
    roleTitle: input.roleTitle,
    companyName: input.companyName,
    bodyText: input.bodyText,
    config,
  });

  const profileSummary = input.profileContext?.trim() || null;

  await sql`
    INSERT INTO growth_signals (
      id, platform, source_url, author_name, author_handle, author_profile_url,
      role_title, company_name, body_text, context_summary, raw_payload, ingested_at
    ) VALUES (
      ${signalId}::uuid,
      ${input.platform},
      ${input.sourceUrl ?? null},
      ${input.authorName},
      ${input.authorHandle ?? null},
      ${input.authorProfileUrl ?? null},
      ${input.roleTitle ?? null},
      ${input.companyName ?? null},
      ${input.bodyText},
      ${input.contextSummary ?? null},
      ${input.rawPayload ? JSON.stringify(input.rawPayload) : null}::jsonb,
      ${now}::timestamptz
    )
  `;

  await sql`
    INSERT INTO growth_leads (
      id, signal_id, full_name, role_title, company_name, profile_url, email, platform,
      icp_score, intent_score, composite_score, score_reasons, pipeline_status,
      profile_summary, created_at, updated_at
    ) VALUES (
      ${leadId}::uuid,
      ${signalId}::uuid,
      ${input.authorName},
      ${input.roleTitle ?? null},
      ${input.companyName ?? null},
      ${input.authorProfileUrl ?? null},
      ${input.email ?? null},
      ${input.platform},
      ${scored.icpScore},
      ${scored.intentScore},
      ${scored.compositeScore},
      ${JSON.stringify(scored.reasons)}::jsonb,
      'new',
      ${profileSummary},
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  const signalRows = asRows<SignalRow>(
    await sql`SELECT * FROM growth_signals WHERE id = ${signalId}::uuid`,
  );
  const leadRows = asRows<LeadRow>(
    await sql`SELECT * FROM growth_leads WHERE id = ${leadId}::uuid`,
  );

  return {
    signal: mapSignal(signalRows[0]),
    lead: mapLead(leadRows[0]),
    draft: null,
  };
}

async function loadLeadSignalContext(leadId: string): Promise<{
  lead: LeadRow;
  signal: SignalRow;
} | null> {
  await ready();
  const sql = getSql();
  const leadRows = asRows<LeadRow>(
    await sql`SELECT * FROM growth_leads WHERE id = ${leadId}::uuid LIMIT 1`,
  );
  const lead = leadRows[0];
  if (!lead?.signal_id) return null;
  const signalRows = asRows<SignalRow>(
    await sql`SELECT * FROM growth_signals WHERE id = ${lead.signal_id}::uuid LIMIT 1`,
  );
  const signal = signalRows[0];
  if (!signal) return null;
  return { lead, signal };
}

export async function generateDraftForLead(
  leadId: string,
): Promise<{
  draft: GrowthDraft;
  usedAi: boolean;
  aiError?: string;
} | null> {
  const ctx = await loadLeadSignalContext(leadId);
  if (!ctx) return null;

  const sql = getSql();
  const config = await getIcpConfig();
  const { lead, signal } = ctx;

  const { body, usedAi, aiError } = await buildPersonalizedReplyDraft({
    platform: (lead.platform ?? signal.platform) as GrowthPlatform,
    authorName: lead.full_name,
    roleTitle: lead.role_title,
    companyName: lead.company_name,
    bodyText: signal.body_text,
    contextSummary: signal.context_summary,
    profileSummary: lead.profile_summary,
    compositeScore: lead.composite_score,
    scoreReasons: parseReasons(lead.score_reasons),
    config,
  });

  const existingRows = asRows<DraftRow>(
    await sql`
      SELECT * FROM growth_drafts
      WHERE lead_id = ${leadId}::uuid
        AND status IN ('pending_review', 'approved', 'failed')
      ORDER BY created_at DESC
      LIMIT 1
    `,
  );
  const existing = existingRows[0];
  const now = new Date().toISOString();

  let draft: GrowthDraft;
  if (existing) {
    const updated = await updateDraft(existing.id, {
      bodyText: body,
      status: "pending_review",
      publishError: null,
    });
    if (!updated) return null;
    draft = updated;
  } else {
    const draftId = crypto.randomUUID();
    await sql`
      INSERT INTO growth_drafts (
        id, lead_id, signal_id, platform, draft_kind, body_text, status, created_at, updated_at
      ) VALUES (
        ${draftId}::uuid,
        ${leadId}::uuid,
        ${lead.signal_id}::uuid,
        ${(lead.platform ?? signal.platform) as string},
        'reply',
        ${body},
        'pending_review',
        ${now}::timestamptz,
        ${now}::timestamptz
      )
    `;
    const draftRows = asRows<DraftRow>(
      await sql`SELECT * FROM growth_drafts WHERE id = ${draftId}::uuid`,
    );
    draft = mapDraft(draftRows[0]);
  }

  if (
    process.env.GROWTH_AUTO_PUBLISH_X === "1" &&
    draft.platform === "x" &&
    signal.source_url?.includes("/status/")
  ) {
    try {
      draft = await publishDraftReply(draft.id, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auto-post failed";
      const failed = await updateDraft(draft.id, {
        publishError: message,
        status: "failed",
      });
      if (failed) draft = failed;
    }
  }

  return { draft, usedAi, aiError };
}

export async function listInbox(options?: {
  minScore?: number;
  platform?: GrowthPlatform | null;
  limit?: number;
}): Promise<{ items: GrowthInboxItem[] }> {
  await ready();
  const sql = getSql();
  const minScore = options?.minScore ?? 0;
  const limit = options?.limit ?? 50;
  const platform = options?.platform ?? null;

  const leadRows = asRows<LeadRow>(
    platform
      ? await sql`
          SELECT * FROM growth_leads
          WHERE composite_score >= ${minScore}
            AND platform = ${platform}
            AND pipeline_status <> 'not_a_fit'
          ORDER BY composite_score DESC, created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT * FROM growth_leads
          WHERE composite_score >= ${minScore}
            AND pipeline_status <> 'not_a_fit'
          ORDER BY composite_score DESC, created_at DESC
          LIMIT ${limit}
        `,
  );

  const leadIds = leadRows.map((l) => l.id);
  const signalIds = leadRows
    .map((l) => l.signal_id)
    .filter(Boolean) as string[];

  const signalRows =
    signalIds.length > 0
      ? asRows<SignalRow>(
          await sql`
            SELECT * FROM growth_signals
            WHERE id = ANY(${signalIds}::uuid[])
          `,
        )
      : [];

  const draftRows =
    leadIds.length > 0
      ? asRows<DraftRow>(
          await sql`
            SELECT DISTINCT ON (lead_id) d.*
            FROM growth_drafts d
            WHERE d.lead_id = ANY(${leadIds}::uuid[])
            ORDER BY d.lead_id, d.created_at DESC
          `,
        )
      : [];

  const signalById = new Map(signalRows.map((s) => [s.id, mapSignal(s)]));
  const draftByLeadId = new Map(
    draftRows.map((d) => [d.lead_id, mapDraft(d)] as const),
  );

  const items: GrowthInboxItem[] = leadRows.map((row) => {
    const lead = mapLead(row);
    const signal = row.signal_id
      ? signalById.get(row.signal_id) ?? null
      : null;
    const draft = draftByLeadId.get(row.id) ?? null;
    return { lead, signal, draft };
  });

  return { items };
}

export async function regenerateDraftWithAi(
  draftId: string,
): Promise<{
  draft: GrowthDraft;
  usedAi: boolean;
  aiError?: string;
} | null> {
  await ready();
  const sql = getSql();
  const config = await getIcpConfig();

  const draftRows = asRows<DraftRow>(
    await sql`SELECT * FROM growth_drafts WHERE id = ${draftId}::uuid LIMIT 1`,
  );
  const draftRow = draftRows[0];
  if (!draftRow?.lead_id || !draftRow.signal_id) return null;

  const leadRows = asRows<LeadRow>(
    await sql`SELECT * FROM growth_leads WHERE id = ${draftRow.lead_id}::uuid`,
  );
  const signalRows = asRows<SignalRow>(
    await sql`SELECT * FROM growth_signals WHERE id = ${draftRow.signal_id}::uuid`,
  );
  const lead = leadRows[0];
  const signal = signalRows[0];
  if (!lead || !signal) return null;

  const { body, usedAi, aiError } = await buildPersonalizedReplyDraft({
    platform: draftRow.platform as GrowthPlatform,
    authorName: lead.full_name,
    roleTitle: lead.role_title,
    companyName: lead.company_name,
    bodyText: signal.body_text,
    contextSummary: signal.context_summary,
    profileSummary: lead.profile_summary,
    compositeScore: lead.composite_score,
    scoreReasons: parseReasons(lead.score_reasons),
    config,
  });

  const updated = await updateDraft(draftId, { bodyText: body });
  if (!updated) return null;

  return { draft: updated, usedAi, aiError };
}

function normalizeCookies(cookies: unknown): Cookie[] {
  if (!Array.isArray(cookies)) return [];
  return cookies as Cookie[];
}

export async function publishDraftReply(
  draftId: string,
  bodyText: string,
): Promise<GrowthDraft> {
  await ready();
  const sql = getSql();
  const draftRows = asRows<DraftRow>(
    await sql`SELECT * FROM growth_drafts WHERE id = ${draftId}::uuid LIMIT 1`,
  );
  const draftRow = draftRows[0];
  if (!draftRow) throw new Error("Draft not found");
  if (draftRow.status === "published") {
    throw new Error("This reply was already posted");
  }
  if (draftRow.platform !== "x") {
    throw new Error(
      "Auto-post is only supported for X replies. Copy the draft for LinkedIn.",
    );
  }
  if (!draftRow.signal_id) {
    throw new Error("Draft is missing the source post");
  }

  const signalRows = asRows<SignalRow>(
    await sql`SELECT * FROM growth_signals WHERE id = ${draftRow.signal_id}::uuid`,
  );
  const signal = signalRows[0];
  if (!signal?.source_url) {
    throw new Error("No tweet URL to reply to — re-harvest or capture with a post link");
  }

  const canUseLocalPlaywright =
    isDevConnectRuntimeEnabled() || process.env.GROWTH_HARVEST_PLAYWRIGHT === "1";
  if (!canUseLocalPlaywright) {
    throw new Error(
      "Posting runs via Playwright on your machine — use npm run dev locally (not production Worker-only deploy yet).",
    );
  }

  const session = await getPlatformSession("x");
  if (!session?.cookies) {
    throw new Error("Connect X in Settings before posting");
  }

  const text = (bodyText.trim() || draftRow.body_text).trim();
  if (!text) throw new Error("Reply text is empty");
  const result = await publishXReplyWithPlaywright(
    normalizeCookies(session.cookies),
    session.userAgent,
    signal.source_url,
    text,
  );

  if (!result.ok) {
    await updateDraft(draftId, {
      bodyText: text,
      status: "failed",
      publishError: result.error,
    });
    throw new Error(result.error);
  }

  const updated = await updateDraft(draftId, {
    bodyText: text,
    status: "published",
    markPublished: true,
    publishError: null,
  });
  if (!updated) throw new Error("Draft not found after post");
  return updated;
}

export async function listLeads(options?: {
  limit?: number;
  minScore?: number;
  maxScore?: number;
  platform?: GrowthPlatform | null;
}): Promise<GrowthLead[]> {
  await ready();
  const sql = getSql();
  const limit = options?.limit ?? 100;
  const minScore = options?.minScore ?? 0;
  const maxScore = options?.maxScore ?? 100;
  const platform = options?.platform ?? null;

  const rows = asRows<LeadRow>(
    platform
      ? await sql`
          SELECT * FROM growth_leads
          WHERE composite_score >= ${minScore}
            AND composite_score <= ${maxScore}
            AND platform = ${platform}
          ORDER BY composite_score DESC, created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT * FROM growth_leads
          WHERE composite_score >= ${minScore}
            AND composite_score <= ${maxScore}
          ORDER BY composite_score DESC, created_at DESC
          LIMIT ${limit}
        `,
  );
  return rows.map(mapLead);
}

export async function updateLead(
  id: string,
  patch: {
    pipelineStatus?: PipelineStatus;
    feedbackNote?: string | null;
  },
): Promise<GrowthLead | null> {
  await ready();
  const sql = getSql();
  const now = new Date().toISOString();
  const rows = asRows<LeadRow>(
    await sql`
      UPDATE growth_leads
      SET
        pipeline_status = COALESCE(${patch.pipelineStatus ?? null}, pipeline_status),
        feedback_note = COALESCE(${patch.feedbackNote ?? null}, feedback_note),
        updated_at = ${now}::timestamptz
      WHERE id = ${id}::uuid
      RETURNING *
    `,
  );
  return rows[0] ? mapLead(rows[0]) : null;
}

export async function updateDraft(
  id: string,
  patch: {
    bodyText?: string;
    imageNotes?: string | null;
    status?: GrowthDraft["status"];
    reviewNotes?: string | null;
    publishError?: string | null;
    markPublished?: boolean;
  },
): Promise<GrowthDraft | null> {
  await ready();
  const sql = getSql();
  const now = new Date().toISOString();
  const publishedAt = patch.markPublished ? now : null;
  const rows = asRows<DraftRow>(
    await sql`
      UPDATE growth_drafts
      SET
        body_text = COALESCE(${patch.bodyText ?? null}, body_text),
        image_notes = COALESCE(${patch.imageNotes ?? null}, image_notes),
        status = COALESCE(${patch.status ?? null}, status),
        review_notes = COALESCE(${patch.reviewNotes ?? null}, review_notes),
        publish_error = COALESCE(${patch.publishError ?? null}, publish_error),
        published_at = COALESCE(${publishedAt}::timestamptz, published_at),
        updated_at = ${now}::timestamptz
      WHERE id = ${id}::uuid
      RETURNING *
    `,
  );
  return rows[0] ? mapDraft(rows[0]) : null;
}

export async function savePlatformCredentials(input: {
  platform: GrowthPlatform;
  cookies: unknown;
  userAgent?: string;
  displayLabel?: string;
}): Promise<void> {
  await ready();
  const { ciphertext, iv } = await encryptJson(input.cookies);
  const sql = getSql();
  const now = new Date().toISOString();
  const accountLabel = input.displayLabel?.trim() || null;
  await sql`
    INSERT INTO growth_platform_credentials (
      platform, cookie_ciphertext, cookie_iv, user_agent, display_label,
      connected_account_label, updated_at, session_status, last_health_check_at, last_error
    ) VALUES (
      ${input.platform},
      ${ciphertext},
      ${iv},
      ${input.userAgent ?? null},
      ${accountLabel},
      ${accountLabel},
      ${now}::timestamptz,
      'active',
      ${now}::timestamptz,
      NULL
    )
    ON CONFLICT (platform) DO UPDATE SET
      cookie_ciphertext = EXCLUDED.cookie_ciphertext,
      cookie_iv = EXCLUDED.cookie_iv,
      user_agent = COALESCE(EXCLUDED.user_agent, growth_platform_credentials.user_agent),
      display_label = COALESCE(EXCLUDED.display_label, growth_platform_credentials.display_label),
      connected_account_label = COALESCE(
        EXCLUDED.connected_account_label,
        growth_platform_credentials.connected_account_label
      ),
      updated_at = EXCLUDED.updated_at,
      session_status = 'active',
      last_health_check_at = EXCLUDED.last_health_check_at,
      last_error = NULL
  `;
}

export async function reportSessionHealth(input: {
  platform: GrowthPlatform;
  sessionStatus: SessionStatus;
  lastError?: string | null;
  connectedAccountLabel?: string | null;
}): Promise<void> {
  await ready();
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`
    UPDATE growth_platform_credentials
    SET
      session_status = ${input.sessionStatus},
      last_health_check_at = ${now}::timestamptz,
      last_error = ${input.lastError ?? null},
      connected_account_label = COALESCE(
        ${input.connectedAccountLabel ?? null},
        connected_account_label
      )
    WHERE platform = ${input.platform}
  `;
}

export async function listCredentialStatus(): Promise<PlatformCredentialStatus[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    platform: string;
    updated_at: string;
    last_sync_at: string | null;
    display_label: string | null;
    session_status: string;
    last_health_check_at: string | null;
    last_error: string | null;
    connected_account_label: string | null;
  }>(
    await sql`
      SELECT platform, updated_at, last_sync_at, display_label,
        session_status, last_health_check_at, last_error, connected_account_label
      FROM growth_platform_credentials
    `,
  );
  const byPlatform = new Map(rows.map((r) => [r.platform, r]));
  return (["linkedin", "x"] as GrowthPlatform[]).map((platform) => {
    const row = byPlatform.get(platform);
    return {
      platform,
      connected: Boolean(row),
      updatedAt: row?.updated_at ?? null,
      lastSyncAt: row?.last_sync_at ?? null,
      displayLabel: row?.display_label ?? null,
      sessionStatus: (row?.session_status as SessionStatus) ?? "disconnected",
      lastHealthCheckAt: row?.last_health_check_at ?? null,
      lastError: row?.last_error ?? null,
      connectedAccountLabel: row?.connected_account_label ?? null,
    };
  });
}

export async function getPlatformSession(
  platform: GrowthPlatform,
): Promise<{ cookies: unknown; userAgent: string | null } | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    cookie_ciphertext: string;
    cookie_iv: string;
    user_agent: string | null;
  }>(
    await sql`
      SELECT cookie_ciphertext, cookie_iv, user_agent
      FROM growth_platform_credentials
      WHERE platform = ${platform}
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    cookies: await decryptJson(row.cookie_ciphertext, row.cookie_iv),
    userAgent: row.user_agent,
  };
}

export async function getPlatformCookies(
  platform: GrowthPlatform,
): Promise<unknown | null> {
  const session = await getPlatformSession(platform);
  return session?.cookies ?? null;
}

export async function touchCredentialSync(platform: GrowthPlatform): Promise<void> {
  await ready();
  const sql = getSql();
  await sql`
    UPDATE growth_platform_credentials
    SET last_sync_at = NOW()
    WHERE platform = ${platform}
  `;
}
