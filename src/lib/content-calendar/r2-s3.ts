import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { R2BucketLike } from "@/lib/content-calendar/media-storage";

const DEFAULT_BUCKET = "stackwise-content-calendar";

export function contentCalendarR2BucketName(): string {
  return (
    process.env.CONTENT_CALENDAR_R2_BUCKET?.trim() ||
    process.env.CONTENT_CALENDAR_BUCKET_NAME?.trim() ||
    DEFAULT_BUCKET
  );
}

export function getContentCalendarR2S3Client(): S3Client | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function s3AsR2Bucket(client: S3Client, bucket = contentCalendarR2BucketName()): R2BucketLike {
  return {
    async put(key, value, options) {
      const body =
        value instanceof ArrayBuffer
          ? new Uint8Array(value)
          : value instanceof Uint8Array
            ? value
            : value;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: options?.httpMetadata?.contentType,
        }),
      );
    },
    async get(key) {
      const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const body = out.Body;
      if (!body) return null;
      const bytes = await body.transformToByteArray();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
      return {
        body: stream,
        httpMetadata: { contentType: out.ContentType },
      };
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}