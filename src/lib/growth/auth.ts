import { getAdminSession } from "@/lib/auth/session";

export async function authorizeGrowthApi(
  request: Request,
): Promise<{ authorized: true } | { authorized: false }> {
  const session = await getAdminSession();
  if (session) return { authorized: true };

  const connectorSecret = process.env.GROWTH_CONNECTOR_SECRET;
  if (!connectorSecret || connectorSecret.length < 32) {
    return { authorized: false };
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { authorized: false };
  }
  const token = header.slice("Bearer ".length).trim();
  if (token.length !== connectorSecret.length) {
    return { authorized: false };
  }
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ connectorSecret.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return { authorized: false };
  }
  return { authorized: true };
}
