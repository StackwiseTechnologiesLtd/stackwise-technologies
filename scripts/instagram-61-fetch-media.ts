/**
 * Print recent IG media ids for the active @loo.ial account (decrypts token from Neon).
 *   npx tsx scripts/instagram-61-fetch-media.ts
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { getAccountAccessToken } from "../src/lib/instagram/repository";
import { getInstagramGraphVersion } from "../src/lib/instagram/graph-version";

const root = process.cwd();
for (const f of [".env.local", ".env"]) {
  if (existsSync(path.join(root, f))) config({ path: path.join(root, f) });
}

async function main() {
  const accountId = process.env.INSTAGRAM_61_ACCOUNT_ID?.trim();
  if (!accountId) {
    console.error("Set INSTAGRAM_61_ACCOUNT_ID (loo.ial row uuid).");
    process.exit(1);
  }

  const token = await getAccountAccessToken(accountId);
  if (!token) {
    console.error("No token for account — reconnect OAuth.");
    process.exit(1);
  }

  const igUserId = process.env.INSTAGRAM_61_IG_USER_ID?.trim();
  if (!igUserId) {
    console.error("Set INSTAGRAM_61_IG_USER_ID");
    process.exit(1);
  }

  const v = getInstagramGraphVersion();
  const url = new URL(`https://graph.instagram.com/${v}/${igUserId}/media`);
  url.searchParams.set("fields", "id,media_type,caption,permalink,timestamp");
  url.searchParams.set("limit", "6");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as {
    data?: Array<{ id: string; media_type: string; caption?: string; permalink?: string }>;
    error?: { message: string };
  };
  if (!res.ok) {
    console.error(json.error?.message ?? res.status);
    process.exit(1);
  }
  for (const row of json.data ?? []) {
    const cap = (row.caption ?? "").replace(/\s+/g, " ").slice(0, 50);
    console.log(`${row.id}\t${row.media_type}\t${cap}`);
    if (row.permalink) console.log(`  ${row.permalink}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});