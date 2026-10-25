import { hashString } from "@/lib/crypto/hash";

export function normalizePortalEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
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
