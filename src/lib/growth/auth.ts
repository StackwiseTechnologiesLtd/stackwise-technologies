import { getAdminSession } from "@/lib/auth/session";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function growthApiSecrets(): string[] {
  const secrets: string[] = [];
  const integrations = process.env.INTEGRATIONS_INGEST_SECRET?.trim();
  const connector = process.env.GROWTH_CONNECTOR_SECRET?.trim();
  if (integrations && integrations.length >= 32) secrets.push(integrations);
  if (connector && connector.length >= 32 && connector !== integrations) {
    secrets.push(connector);
  }
  return secrets;
}

export async function authorizeGrowthApi(
  request: Request,
): Promise<{ authorized: true } | { authorized: false }> {
  const session = await getAdminSession();
  if (session) return { authorized: true };

  const secrets = growthApiSecrets();
  if (secrets.length === 0) return { authorized: false };

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return { authorized: false };
  const token = header.slice("Bearer ".length).trim();
  for (const secret of secrets) {
    if (timingSafeEqual(token, secret)) return { authorized: true };
  }
  return { authorized: false };
}
