import { getAdminSession } from "@/lib/auth/session";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function ingestSecrets(): string[] {
  const secrets: string[] = [];
  const integrations = process.env.INTEGRATIONS_INGEST_SECRET?.trim();
  const connector = process.env.GROWTH_CONNECTOR_SECRET?.trim();
  const huginn = process.env.HUGINN_WEBHOOK_TOKEN?.trim();
  if (integrations && integrations.length >= 32) secrets.push(integrations);
  if (connector && connector.length >= 32 && connector !== integrations) {
    secrets.push(connector);
  }
  if (
    huginn &&
    huginn.length >= 32 &&
    huginn !== integrations &&
    huginn !== connector
  ) {
    secrets.push(huginn);
  }
  return secrets;
}

/** Admin session or bearer token for machine ingest (Huginn, freehire adapter). */
export async function authorizeIntegrationsIngest(
  request: Request,
): Promise<{ authorized: true } | { authorized: false }> {
  const session = await getAdminSession();
  if (session) return { authorized: true };

  const secrets = ingestSecrets();
  if (secrets.length === 0) return { authorized: false };

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return { authorized: false };
  const token = header.slice("Bearer ".length).trim();
  for (const secret of secrets) {
    if (timingSafeEqual(token, secret)) return { authorized: true };
  }
  return { authorized: false };
}
