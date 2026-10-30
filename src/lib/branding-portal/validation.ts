import { brandExistsAsync, getBrand } from "@/lib/branding/brands";
import { normalizeBrandSlug } from "@/lib/branding-portal/identity";

export const PORTAL_EMAIL_MAX_LENGTH = 254;
export const PORTAL_PASSWORD_MIN_LENGTH = 8;
export const PORTAL_PASSWORD_MAX_LENGTH = 128;
export const PORTAL_OTP_LENGTH = 6;

/** Practical RFC-inspired check; values are stored only via parameterized SQL. */
const PORTAL_EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasControlChars(value: string): boolean {
  return /[\x00-\x1f\x7f]/.test(value);
}

export function parsePortalEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > PORTAL_EMAIL_MAX_LENGTH) {
    return null;
  }
  if (hasControlChars(normalized) || normalized.includes("..")) {
    return null;
  }
  if (!PORTAL_EMAIL_RE.test(normalized)) return null;
  return normalized;
}

export function parsePortalPassword(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw;
  if (hasControlChars(value)) return null;
  if (value.length < PORTAL_PASSWORD_MIN_LENGTH) return null;
  if (value.length > PORTAL_PASSWORD_MAX_LENGTH) return null;
  return value;
}

/** Login attempt: allow verifying legacy shorter passwords already stored. */
export function parsePortalPasswordForLogin(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (hasControlChars(raw)) return null;
  if (raw.length === 0 || raw.length > PORTAL_PASSWORD_MAX_LENGTH) return null;
  return raw;
}

export function parsePortalOtp(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.trim();
  if (!/^\d{6}$/.test(digits)) return null;
  return digits;
}

export function parsePortalMemberId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim().toLowerCase();
  if (!UUID_RE.test(id)) return null;
  return id;
}

export function parsePortalBrandSlug(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const slug = normalizeBrandSlug(raw);
  if (!slug || !getBrand(slug)) return null;
  return slug;
}

export async function parsePortalBrandSlugAsync(raw: unknown): Promise<string | null> {
  if (typeof raw !== "string") return null;
  const slug = normalizeBrandSlug(raw);
  if (!slug) return null;
  if (!(await brandExistsAsync(slug))) return null;
  return slug;
}

export type PortalAuthMethod = "password" | "otp";

export function parsePortalAuthMethod(raw: unknown): PortalAuthMethod {
  return raw === "otp" ? "otp" : "password";
}

/** Optional admin-provided password when creating an account. */
export function parsePortalPasswordForCreate(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  return parsePortalPassword(raw);
}
