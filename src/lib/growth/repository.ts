import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { decryptJson, encryptJson } from "@/lib/growth/crypto";
import { buildReplyDraft } from "@/lib/growth/drafts";
import { DEFAULT_ICP_CONFIG } from "@/lib/growth/icp-default";
import { scoreLead } from "@/lib/growth/scoring";
import type {
  GrowthDraft,
  GrowthLead,
  GrowthPlatform,
  GrowthSignal,
  IcpConfig,
  IngestSignalInput,
  PlatformCredentialStatus,
  PipelineStatus,
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
): Promise<{ signal: GrowthSignal; lead: GrowthLead; draft: GrowthDraft }> {
  await ready();
  const sql = getSql();
  const config = await getIcpConfig();
  const signalId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const draftId = crypto.randomUUID();
  const now = new Date().toISOString();

  const scored = scoreLead({
    roleTitle: input.roleTitle,
    companyName: input.companyName,
    bodyText: input.bodyText,
    config,
  });

  const draftBody = buildReplyDraft({
    authorName: input.authorName,
    bodyText: input.bodyText,
    contextSummary: input.contextSummary,
  });

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
      created_at, updated_at
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
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  await sql`
    INSERT INTO growth_drafts (
      id, lead_id, signal_id, platform, draft_kind, body_text, status, created_at, updated_at
    ) VALUES (
      ${draftId}::uuid,
      ${leadId}::uuid,
      ${signalId}::uuid,
      ${input.platform},
      'reply',
      ${draftBody},
      'pending_review',
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
  const draftRows = asRows<DraftRow>(
    await sql`SELECT * FROM growth_drafts WHERE id = ${draftId}::uuid`,
  );

  return {
    signal: mapSignal(signalRows[0]),
    lead: mapLead(leadRows[0]),
    draft: mapDraft(draftRows[0]),
  };
}

export async function listInbox(): Promise<{
  drafts: GrowthDraft[];
  leads: GrowthLead[];
  signals: GrowthSignal[];
}> {
  await ready();
  const sql = getSql();
  const draftRows = asRows<DraftRow>(
    await sql`
      SELECT * FROM growth_drafts
      WHERE status IN ('pending_review', 'approved')
      ORDER BY created_at DESC
      LIMIT 50
    `,
  );
  const leadRows = asRows<LeadRow>(
    await sql`
      SELECT * FROM growth_leads
      ORDER BY created_at DESC
      LIMIT 50
    `,
  );
  const signalRows = asRows<SignalRow>(
    await sql`
      SELECT * FROM growth_signals
      ORDER BY ingested_at DESC
      LIMIT 50
    `,
  );
  return {
    drafts: draftRows.map(mapDraft),
    leads: leadRows.map(mapLead),
    signals: signalRows.map(mapSignal),
  };
}

export async function listLeads(limit = 100): Promise<GrowthLead[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<LeadRow>(
    await sql`
      SELECT * FROM growth_leads
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
  await sql`
    INSERT INTO growth_platform_credentials (
      platform, cookie_ciphertext, cookie_iv, user_agent, display_label, updated_at
    ) VALUES (
      ${input.platform},
      ${ciphertext},
      ${iv},
      ${input.userAgent ?? null},
      ${input.displayLabel ?? null},
      ${now}::timestamptz
    )
    ON CONFLICT (platform) DO UPDATE SET
      cookie_ciphertext = EXCLUDED.cookie_ciphertext,
      cookie_iv = EXCLUDED.cookie_iv,
      user_agent = COALESCE(EXCLUDED.user_agent, growth_platform_credentials.user_agent),
      display_label = COALESCE(EXCLUDED.display_label, growth_platform_credentials.display_label),
      updated_at = EXCLUDED.updated_at
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
  }>(
    await sql`
      SELECT platform, updated_at, last_sync_at, display_label
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
