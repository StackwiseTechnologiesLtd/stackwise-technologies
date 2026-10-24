import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { decryptJson, encryptJson } from "@/lib/growth/crypto";
import { buildPersonalizedReplyDraft } from "@/lib/growth/personalized-draft";
import { DEFAULT_ICP_CONFIG } from "@/lib/growth/icp-default";
import { INBOX_DEFAULT_FRESHNESS_HOURS } from "@/lib/growth/harvest-config";
import { freshnessCutoffIso } from "@/lib/growth/harvest-freshness";
import { resolveGrowthPostUrl } from "@/lib/growth/post-url";
import { scoreLead } from "@/lib/growth/scoring";
import {
  parseLeadSource,
  type GrowthDraft,
  type GrowthInboxItem,
  type GrowthLead,
  type GrowthPlatform,
  type GrowthSignal,
  type IcpConfig,
  type IngestSignalInput,
  type LeadSource,
  type PlatformCredentialStatus,
  type PipelineStatus,
  type SessionStatus,
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
  posted_at: string | null;
  lead_source: string | null;
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
  lead_source: string | null;
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
  const platform = row.platform as GrowthPlatform;
  return {
    id: row.id,
    platform,
    sourceUrl: resolveGrowthPostUrl({
      platform,
      sourceUrl: row.source_url,
      authorProfileUrl: row.author_profile_url,
      authorHandle: row.author_handle,
    }),
    authorName: row.author_name,
    authorHandle: row.author_handle,
    authorProfileUrl: row.author_profile_url,
    roleTitle: row.role_title,
    companyName: row.company_name,
    bodyText: row.body_text,
    contextSummary: row.context_summary,
    ingestedAt: row.ingested_at,
    postedAt: row.posted_at ?? null,
    leadSource: parseLeadSource(row.lead_source),
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
    leadSource: parseLeadSource(row.lead_source),
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

export async function signalAlreadyIngested(
  input: IngestSignalInput,
): Promise<boolean> {
  await ready();
  const sql = getSql();
  const url = input.sourceUrl?.trim();
  if (url) {
    const rows = asRows<{ id: string }>(
      await sql`
        SELECT id FROM growth_signals WHERE source_url = ${url} LIMIT 1
      `,
    );
    if (rows.length > 0) return true;
  }
  const snippet = input.bodyText.trim().slice(0, 400);
  const rows = asRows<{ id: string }>(
    await sql`
      SELECT id FROM growth_signals
      WHERE platform = ${input.platform}
        AND LEFT(body_text, 400) = ${snippet}
        AND ingested_at > NOW() - INTERVAL '14 days'
      LIMIT 1
    `,
  );
  return rows.length > 0;
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
  const leadSource: LeadSource = input.leadSource ?? "harvest";
  const postedAt = input.postedAt?.trim() || null;

  await sql`
    INSERT INTO growth_signals (
      id, platform, source_url, author_name, author_handle, author_profile_url,
      role_title, company_name, body_text, context_summary, raw_payload,
      ingested_at, posted_at, lead_source
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
      ${now}::timestamptz,
      ${postedAt}::timestamptz,
      ${leadSource}
    )
  `;

  await sql`
    INSERT INTO growth_leads (
      id, signal_id, full_name, role_title, company_name, profile_url, email, platform,
      icp_score, intent_score, composite_score, score_reasons, pipeline_status,
      profile_summary, lead_source, created_at, updated_at
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
      ${leadSource},
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

  return { draft, usedAi, aiError };
}

export async function listInbox(options?: {
  minScore?: number;
  platform?: GrowthPlatform | null;
  leadSource?: LeadSource | null;
  limit?: number;
  /** When set, only leads tied to signals this recent (posted or ingested). */
  freshnessHours?: number | null;
}): Promise<{ items: GrowthInboxItem[] }> {
  await ready();
  const sql = getSql();
  const minScore = options?.minScore ?? 0;
  const limit = options?.limit ?? 50;
  const platform = options?.platform ?? null;
  const leadSource = options?.leadSource ?? null;
  const freshnessHours =
    options?.freshnessHours === undefined
      ? INBOX_DEFAULT_FRESHNESS_HOURS
      : options.freshnessHours;
  const cutoff =
    freshnessHours != null && freshnessHours > 0
      ? freshnessCutoffIso(freshnessHours)
      : null;

  const leadRows = asRows<LeadRow>(
    await sql`
      SELECT l.*
      FROM growth_leads l
      LEFT JOIN growth_signals s ON s.id = l.signal_id
      WHERE l.composite_score >= ${minScore}
        AND l.pipeline_status <> 'not_a_fit'
        AND (${platform}::text IS NULL OR l.platform = ${platform} OR s.platform = ${platform})
        AND (${leadSource}::text IS NULL OR l.lead_source = ${leadSource})
        AND (
          ${cutoff}::timestamptz IS NULL
          OR COALESCE(s.posted_at, s.ingested_at) >= ${cutoff}::timestamptz
        )
      ORDER BY COALESCE(s.posted_at, s.ingested_at, l.created_at) DESC NULLS LAST,
        l.composite_score DESC
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
    const signal = row.signal_id
      ? signalById.get(row.signal_id) ?? null
      : null;
    const mapped = mapLead(row);
    const leadPlatform =
      (row.platform as GrowthPlatform | null) ??
      signal?.platform ??
      mapped.platform;
    const lead = {
      ...mapped,
      platform: leadPlatform,
      sourceUrl: resolveGrowthPostUrl({
        platform: leadPlatform ?? signal?.platform,
        sourceUrl: signal?.sourceUrl ?? null,
        authorProfileUrl: signal?.authorProfileUrl ?? mapped.profileUrl,
        authorHandle: signal?.authorHandle ?? null,
      }),
    };
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
          SELECT l.*
          FROM growth_leads l
          LEFT JOIN growth_signals s ON s.id = l.signal_id
          WHERE l.composite_score >= ${minScore}
            AND l.composite_score <= ${maxScore}
            AND (l.platform = ${platform} OR s.platform = ${platform})
          ORDER BY l.composite_score DESC, l.created_at DESC
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

  const signalIds = rows
    .map((r) => r.signal_id)
    .filter((id): id is string => Boolean(id));
  const signalRows =
    signalIds.length > 0
      ? asRows<SignalRow>(
          await sql`
            SELECT id, platform, source_url, author_profile_url, author_handle
            FROM growth_signals
            WHERE id = ANY(${signalIds}::uuid[])
          `,
        )
      : [];
  const signalMetaById = new Map(
    signalRows.map((s) => [s.id, s] as const),
  );

  return rows.map((row) => {
    const lead = mapLead(row);
    const signal = row.signal_id
      ? signalMetaById.get(row.signal_id)
      : undefined;
    const leadPlatform =
      (row.platform as GrowthPlatform | null) ??
      (signal?.platform as GrowthPlatform | undefined) ??
      null;
    const sourceUrl = resolveGrowthPostUrl({
      platform: leadPlatform ?? signal?.platform,
      sourceUrl: signal?.source_url ?? null,
      authorProfileUrl: signal?.author_profile_url ?? lead.profileUrl,
      authorHandle: signal?.author_handle ?? null,
    });
    return {
      ...lead,
      platform: leadPlatform ?? lead.platform,
      sourceUrl,
    };
  });
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
