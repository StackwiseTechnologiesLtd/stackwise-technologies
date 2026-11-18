export type R2BucketLike = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<unknown>;
  get: (
    key: string,
  ) => Promise<{ body: ReadableStream | null; httpMetadata?: { contentType?: string } } | null>;
  delete: (key: string) => Promise<void>;
};

export type ContentCalendarBucketEnv = {
  CONTENT_CALENDAR_BUCKET?: R2BucketLike;
};

export async function getContentCalendarBucketBinding(): Promise<R2BucketLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as ContentCalendarBucketEnv).CONTENT_CALENDAR_BUCKET;
    return bucket ?? null;
  } catch {
    return null;
  }
}

/** Worker R2 binding in prod/preview; S3 API to the same bucket during `next dev`. */
export async function getContentCalendarBucket(): Promise<R2BucketLike | null> {
  const binding = await getContentCalendarBucketBinding();
  if (binding) return binding;

  const { getContentCalendarR2S3Client, s3AsR2Bucket } = await import("@/lib/content-calendar/r2-s3");
  const client = getContentCalendarR2S3Client();
  if (!client) return null;
  return s3AsR2Bucket(client);
}

export function buildR2Key(postId: string, assetId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
  return `content-calendar/${postId}/${assetId}/${safe}`;
}

export const CONTENT_CALENDAR_MAX_BYTES = 25 * 1024 * 1024;

/** Stored as `content_type`; `filename` holds the URL. No R2 blob. */
export const CONTENT_CALENDAR_LINK_TYPE = "application/x-stackwise-url";

export function isAllowedMediaType(contentType: string): boolean {
  if (contentType.startsWith("image/")) return true;
  if (contentType.startsWith("video/")) return true;
  if (contentType.startsWith("audio/")) return true;
  if (contentType === "application/pdf") return true;
  return false;
}

export function isContentCalendarLinkAsset(contentType: string): boolean {
  return contentType === CONTENT_CALENDAR_LINK_TYPE;
}