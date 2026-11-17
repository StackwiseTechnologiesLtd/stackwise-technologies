function splitEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function agencyAlertRecipients(): string[] {
  const explicit = splitEmails(process.env.AGENCY_ALERT_EMAILS);
  if (explicit.length > 0) return explicit;
  return splitEmails(
    process.env.ADMIN_NOTIFY_EMAILS ?? process.env.ADMIN_EMAILS,
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function cronSecrets(): string[] {
  const out: string[] = [];
  const dedicated = process.env.AGENCY_ALERT_CRON_SECRET?.trim();
  const ingest = process.env.INTEGRATIONS_INGEST_SECRET?.trim();
  const connector = process.env.GROWTH_CONNECTOR_SECRET?.trim();
  for (const s of [dedicated, ingest, connector]) {
    if (s && s.length >= 32 && !out.includes(s)) out.push(s);
  }
  return out;
}

/** Bearer token for `POST /api/cron/agency-alerts` (cron script or Cloudflare HTTP trigger). */
export function authorizeAgencyAlertCron(
  request: Request,
): { authorized: true } | { authorized: false } {
  const secrets = cronSecrets();
  if (secrets.length === 0) return { authorized: false };

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return { authorized: false };
  const token = header.slice("Bearer ".length).trim();
  for (const secret of secrets) {
    if (timingSafeEqual(token, secret)) return { authorized: true };
  }
  return { authorized: false };
}

export function publicSiteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "https://stackwisetechnologies.com"
  );
}