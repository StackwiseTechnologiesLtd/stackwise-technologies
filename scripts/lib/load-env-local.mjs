import fs from "node:fs";
import path from "node:path";

/** Load .env.local then .env for integration CLI scripts (does not override existing env). */
export function loadEnvLocal() {
  for (const filename of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), filename);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

export function defaultIngestUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) return `${site}/api/admin/integrations/ingest`;
  return "http://localhost:3000/api/admin/integrations/ingest";
}

export function requireIngestSecret() {
  const secret = process.env.INTEGRATIONS_INGEST_SECRET?.trim();
  if (!secret || secret.length < 32) {
    console.error(
      "Set INTEGRATIONS_INGEST_SECRET in .env.local (at least 32 characters).",
    );
    console.error("Generate one: npm run integrations:secret");
    process.exit(1);
  }
  return secret;
}
