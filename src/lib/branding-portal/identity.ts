import { hashString } from "@/lib/crypto/hash";
import { parsePortalEmail } from "@/lib/branding-portal/validation";

export function normalizePortalEmail(email: string): string | null {
  return parsePortalEmail(email);
}

export function normalizeBrandSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
}

export async function brandPortalOtpSubjectHash(
  brandSlug: string,
  email: string,
): Promise<string | null> {
  const normalizedEmail = normalizePortalEmail(email);
  const normalizedSlug = normalizeBrandSlug(brandSlug);
  if (!normalizedEmail || !normalizedSlug) return null;
  return hashString(`brand-portal:${normalizedSlug}:${normalizedEmail}`);
}
