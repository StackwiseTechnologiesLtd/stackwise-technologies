import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { isoDateLocal } from "@/lib/content-calendar/dates";
import {
  buildR2Key,
  CONTENT_CALENDAR_LINK_TYPE,
  CONTENT_CALENDAR_MAX_BYTES,
  getContentCalendarBucket,
  isAllowedMediaType,
} from "@/lib/content-calendar/media-storage";
import {
  contentCalendarChannels,
  contentCalendarStatuses,
  type ContentCalendarAsset,
  type ContentCalendarChannel,
  type ContentCalendarPost,
  type ContentCalendarPostDetail,
  type ContentCalendarStatus,
} from "@/lib/content-calendar/types";

async function ready() {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is required");
  await ensureSchema();
}

type PostRow = {
  id: string;
  title: string;
  scheduled_on: string | Date;
  scheduled_time: string | null;
  channel: string;
  status: string;
  script: string;
  notes: string;
  accent: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

type AssetRow = {
  id: string;
  post_id: string;
  r2_key: string | null;
  content_type: string;
  filename: string;
  byte_size: number;
  sort_order: number;
  dev_data: Uint8Array | null;
  created_at: string;
};

function parseChannel(v: string): ContentCalendarChannel {
  if (contentCalendarChannels.includes(v as ContentCalendarChannel)) {
    return v as ContentCalendarChannel;
  }
  return "other";
}

function parseStatus(v: string): ContentCalendarStatus {
  if (contentCalendarStatuses.includes(v as ContentCalendarStatus)) {
    return v as ContentCalendarStatus;
  }
  return "draft";
}

function formatScheduledOn(value: string | Date): string {
  if (value instanceof Date) return isoDateLocal(value);
  return String(value).slice(0, 10);
}

function mapPost(row: PostRow): ContentCalendarPost {
  return {
    id: row.id,
    title: row.title,
    scheduledOn: formatScheduledOn(row.scheduled_on),
    scheduledTime: row.scheduled_time,
    channel: parseChannel(row.channel),
    status: parseStatus(row.status),
    script: row.script,
    notes: row.notes,
    accent: row.accent,
    projectId: row.project_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAsset(row: AssetRow): ContentCalendarAsset {
  return {
    id: row.id,
    postId: row.post_id,
    contentType: row.content_type,
    filename: row.filename,
    byteSize: row.byte_size,
    sortOrder: row.sort_order,
    hasR2: Boolean(row.r2_key),
    hasDevBlob: Boolean(row.dev_data),
    createdAt: row.created_at,
  };
}

export async function listContentCalendarPosts(options: {
  from: string;
  to: string;
}): Promise<ContentCalendarPostDetail[]> {
  await ready();
  const sql = getSql();
  const postRows = asRows<PostRow>(
    await sql`
      SELECT
        id, title, scheduled_on, scheduled_time, channel, status,
        ''::text AS script, ''::text AS notes, accent, project_id, created_at, updated_at
      FROM content_calendar_posts
      WHERE scheduled_on >= ${options.from}::date
        AND scheduled_on <= ${options.to}::date
      ORDER BY scheduled_on ASC, scheduled_time NULLS LAST, title ASC
    `,
  );
  if (postRows.length === 0) return [];

  const ids = postRows.map((p) => p.id);
  const assetRows = asRows<AssetRow>(
    await sql`
      SELECT
        id, post_id, r2_key, content_type, filename, byte_size, sort_order, created_at,
        NULL::bytea AS dev_data
      FROM content_calendar_assets
      WHERE post_id = ANY(${ids}::uuid[])
      ORDER BY sort_order ASC, created_at ASC
    `,
  );
  const byPost = new Map<string, ContentCalendarAsset[]>();
  for (const row of assetRows) {
    const list = byPost.get(row.post_id) ?? [];
    list.push(mapAsset(row));
    byPost.set(row.post_id, list);
  }

  return postRows.map((row) => ({
    ...mapPost(row),
    assets: byPost.get(row.id) ?? [],
  }));
}

export async function getContentCalendarPost(id: string): Promise<ContentCalendarPostDetail | null> {
  await ready();
  const sql = getSql();
  const postRows = asRows<PostRow>(
    await sql`SELECT * FROM content_calendar_posts WHERE id = ${id}::uuid LIMIT 1`,
  );
  if (!postRows[0]) return null;
  const assetRows = asRows<AssetRow>(
    await sql`
      SELECT * FROM content_calendar_assets
      WHERE post_id = ${id}::uuid
      ORDER BY sort_order ASC, created_at ASC
    `,
  );
  return { ...mapPost(postRows[0]), assets: assetRows.map(mapAsset) };
}

export type UpsertContentCalendarInput = {
  title: string;
  scheduledOn: string;
  scheduledTime?: string | null;
  channel?: ContentCalendarChannel;
  status?: ContentCalendarStatus;
  script?: string;
  notes?: string;
  accent?: string;
  projectId?: string | null;
};

export async function createContentCalendarPost(
  input: UpsertContentCalendarInput,
): Promise<ContentCalendarPostDetail> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  await sql`
    INSERT INTO content_calendar_posts (
      id, title, scheduled_on, scheduled_time, channel, status,
      script, notes, accent, project_id, updated_at
    ) VALUES (
      ${id}::uuid,
      ${title},
      ${input.scheduledOn}::date,
      ${input.scheduledTime ?? null},
      ${input.channel ?? "instagram"},
      ${input.status ?? "draft"},
      ${input.script ?? ""},
      ${input.notes ?? ""},
      ${input.accent ?? "#e85d8a"},
      ${input.projectId ? input.projectId : null}::uuid,
      NOW()
    )
  `;
  const detail = await getContentCalendarPost(id);
  if (!detail) throw new Error("Create failed");
  return detail;
}

export async function updateContentCalendarPost(
  id: string,
  input: UpsertContentCalendarInput,
): Promise<ContentCalendarPostDetail> {
  await ready();
  const sql = getSql();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  const existing = await getContentCalendarPost(id);
  if (!existing) throw new Error("Post not found");

  await sql`
    UPDATE content_calendar_posts
    SET
      title = ${title},
      scheduled_on = ${input.scheduledOn}::date,
      scheduled_time = ${input.scheduledTime ?? null},
      channel = ${input.channel ?? existing.channel},
      status = ${input.status ?? existing.status},
      script = ${input.script ?? existing.script},
      notes = ${input.notes ?? existing.notes},
      accent = ${input.accent ?? existing.accent},
      project_id = ${input.projectId !== undefined ? input.projectId : existing.projectId}::uuid,
      updated_at = NOW()
    WHERE id = ${id}::uuid
  `;
  const detail = await getContentCalendarPost(id);
  if (!detail) throw new Error("Update failed");
  return detail;
}

export async function deleteContentCalendarPost(id: string): Promise<void> {
  await ready();
  const sql = getSql();
  const assets = asRows<{ id: string; r2_key: string | null }>(
    await sql`SELECT id, r2_key FROM content_calendar_assets WHERE post_id = ${id}::uuid`,
  );
  const bucket = await getContentCalendarBucket();
  if (bucket) {
    for (const a of assets) {
      if (a.r2_key) await bucket.delete(a.r2_key).catch(() => undefined);
    }
  }
  await sql`DELETE FROM content_calendar_posts WHERE id = ${id}::uuid`;
}

export async function addContentCalendarAsset(
  postId: string,
  file: File,
): Promise<ContentCalendarAsset> {
  await ready();
  if (!isAllowedMediaType(file.type)) {
    throw new Error("Only image and video files are supported");
  }
  if (file.size > CONTENT_CALENDAR_MAX_BYTES) {
    throw new Error("File exceeds 25MB limit");
  }

  const post = await getContentCalendarPost(postId);
  if (!post) throw new Error("Post not found");

  const sql = getSql();
  const assetId = crypto.randomUUID();
  const buffer = await file.arrayBuffer();
  const bucket = await getContentCalendarBucket();
  let r2Key: string | null = null;
  let devData: Uint8Array | null = null;

  if (bucket) {
    r2Key = buildR2Key(postId, assetId, file.name);
    await bucket.put(r2Key, buffer, { httpMetadata: { contentType: file.type } });
  } else {
    devData = new Uint8Array(buffer);
  }

  const sortOrder = post.assets.length;
  await sql`
    INSERT INTO content_calendar_assets (
      id, post_id, r2_key, content_type, filename, byte_size, sort_order, dev_data
    ) VALUES (
      ${assetId}::uuid,
      ${postId}::uuid,
      ${r2Key},
      ${file.type},
      ${file.name},
      ${file.size},
      ${sortOrder},
      ${devData}
    )
  `;

  const rows = asRows<AssetRow>(
    await sql`SELECT * FROM content_calendar_assets WHERE id = ${assetId}::uuid LIMIT 1`,
  );
  if (!rows[0]) throw new Error("Asset save failed");
  return mapAsset(rows[0]);
}

export async function addContentCalendarLink(
  postId: string,
  rawUrl: string,
): Promise<ContentCalendarAsset> {
  await ready();
  const trimmed = rawUrl.trim();
  let href: string;
  try {
    href = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).href;
  } catch {
    throw new Error("Enter a valid URL");
  }

  const post = await getContentCalendarPost(postId);
  if (!post) throw new Error("Post not found");

  const sql = getSql();
  const assetId = crypto.randomUUID();
  const sortOrder = post.assets.length;

  await sql`
    INSERT INTO content_calendar_assets (
      id, post_id, r2_key, content_type, filename, byte_size, sort_order, dev_data
    ) VALUES (
      ${assetId}::uuid,
      ${postId}::uuid,
      ${null},
      ${CONTENT_CALENDAR_LINK_TYPE},
      ${href},
      ${0},
      ${sortOrder},
      ${null}
    )
  `;

  const rows = asRows<AssetRow>(
    await sql`SELECT * FROM content_calendar_assets WHERE id = ${assetId}::uuid LIMIT 1`,
  );
  if (!rows[0]) throw new Error("Link save failed");
  return mapAsset(rows[0]);
}

export async function deleteContentCalendarAsset(assetId: string): Promise<void> {
  await ready();
  const sql = getSql();
  const rows = asRows<{ r2_key: string | null }>(
    await sql`SELECT r2_key FROM content_calendar_assets WHERE id = ${assetId}::uuid LIMIT 1`,
  );
  if (!rows[0]) throw new Error("Asset not found");
  const bucket = await getContentCalendarBucket();
  if (bucket && rows[0].r2_key) {
    await bucket.delete(rows[0].r2_key).catch(() => undefined);
  }
  await sql`DELETE FROM content_calendar_assets WHERE id = ${assetId}::uuid`;
}

export async function getContentCalendarAssetBlob(assetId: string): Promise<{
  contentType: string;
  body: ArrayBuffer;
} | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    r2_key: string | null;
    content_type: string;
    dev_data: Uint8Array | null;
  }>(
    await sql`
      SELECT r2_key, content_type, dev_data
      FROM content_calendar_assets
      WHERE id = ${assetId}::uuid
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;

  if (row.r2_key) {
    const bucket = await getContentCalendarBucket();
    if (bucket) {
      try {
        const obj = await bucket.get(row.r2_key);
        if (obj?.body) {
          const buf = await new Response(obj.body).arrayBuffer();
          return {
            contentType: obj.httpMetadata?.contentType ?? row.content_type,
            body: buf,
          };
        }
      } catch {
        /* fall through to dev_data */
      }
    }
  }

  if (row.dev_data) {
    const bytes =
      row.dev_data instanceof Uint8Array
        ? row.dev_data
        : new Uint8Array(row.dev_data as ArrayBuffer);
    const copy = new Uint8Array(bytes);
    return { contentType: row.content_type, body: copy.buffer };
  }

  return null;
}

export async function countUpcomingContentPosts(days = 7): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureSchema();
  const sql = getSql();
  const rows = asRows<{ n: number }>(
    await sql`
      SELECT COUNT(*)::int AS n
      FROM content_calendar_posts
      WHERE scheduled_on >= CURRENT_DATE
        AND scheduled_on < CURRENT_DATE + ${days}::int
        AND status != 'published'
    `,
  );
  return rows[0]?.n ?? 0;
}