type R2BucketLike = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<unknown>;
  get: (key: string) => Promise<{ body: ReadableStream | null; httpMetadata?: { contentType?: string } } | null>;
  delete: (key: string) => Promise<void>;
};

export type ContentCalendarBucketEnv = {
  CONTENT_CALENDAR_BUCKET?: R2BucketLike;
};

export async function getContentCalendarBucket(): Promise<R2BucketLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as ContentCalendarBucketEnv).CONTENT_CALENDAR_BUCKET;
    return bucket ?? null;
  } catch {
    return null;
  }
}

export function buildR2Key(postId: string, assetId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
  return `content-calendar/${postId}/${assetId}/${safe}`;
}

export const CONTENT_CALENDAR_MAX_BYTES = 25 * 1024 * 1024;

export function isAllowedMediaType(contentType: string): boolean {
  if (contentType.startsWith("image/")) return true;
  if (contentType.startsWith("video/")) return true;
  return false;
}