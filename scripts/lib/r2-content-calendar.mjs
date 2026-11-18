/**
 * Upload/list helpers for content-calendar demo seed (R2 via S3 API or wrangler CLI).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const DEFAULT_BUCKET = "stackwise-content-calendar";

export function contentCalendarBucketName() {
  return process.env.CONTENT_CALENDAR_R2_BUCKET?.trim() || DEFAULT_BUCKET;
}

function s3ClientFromEnv() {
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

export async function putContentCalendarObject(key, filePath, contentType) {
  const body = fs.readFileSync(filePath);
  const client = s3ClientFromEnv();
  const bucket = contentCalendarBucketName();

  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return { via: "s3", key, byteSize: body.byteLength };
  }

  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const wrangler = path.join(repoRoot, "node_modules", ".bin", "wrangler");
  const target = `${bucket}/${key}`;
  execFileSync(
    fs.existsSync(wrangler) ? wrangler : "npx",
    fs.existsSync(wrangler)
      ? ["r2", "object", "put", target, "--file", filePath, "--content-type", contentType]
      : ["wrangler", "r2", "object", "put", target, "--file", filePath, "--content-type", contentType],
    { cwd: repoRoot, stdio: "pipe" },
  );
  return { via: "wrangler", key, byteSize: body.byteLength };
}

export function canUploadToR2() {
  if (s3ClientFromEnv()) return true;
  return Boolean(process.env.WRANGLER_API_TOKEN?.trim() || process.env.CLOUDFLARE_API_TOKEN?.trim());
}

export function buildDemoR2Key(postId, assetId, filename) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
  return `content-calendar/${postId}/${assetId}/${safe}`;
}