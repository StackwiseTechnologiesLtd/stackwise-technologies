const MIN_SECRET_LENGTH = 32;

const DEV_ADMIN_SESSION_SECRET =
  "stackwise-local-admin-session-secret-32ch-min";
const DEV_BRAND_PORTAL_SESSION_SECRET =
  "stackwise-local-brand-portal-session-32ch";

function readEnvSecret(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value && value.length >= MIN_SECRET_LENGTH) {
      return value;
    }
  }
  return "";
}

/** HMAC key for `sw_admin_session` — not related to payment providers. */
export function getAdminSessionSecret(): string {
  const secret = readEnvSecret("ADMIN_SESSION_SECRET", "SESSION_SECRET");
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return DEV_ADMIN_SESSION_SECRET;
  }

  throw new Error(
    "Set ADMIN_SESSION_SECRET or SESSION_SECRET (at least 32 characters) for admin sign-in.",
  );
}

/** HMAC key for `sw_brand_portal_session`. */
export function getBrandPortalSessionSecret(): string {
  const secret = readEnvSecret(
    "BRAND_PORTAL_SESSION_SECRET",
    "ADMIN_SESSION_SECRET",
    "SESSION_SECRET",
  );
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return DEV_BRAND_PORTAL_SESSION_SECRET;
  }

  throw new Error(
    "Set BRAND_PORTAL_SESSION_SECRET, ADMIN_SESSION_SECRET, or SESSION_SECRET (at least 32 characters) for brand guidelines access.",
  );
}
