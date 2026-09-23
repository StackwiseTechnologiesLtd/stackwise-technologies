import { hashString } from "@/lib/crypto/hash";

export function normalizeAdminEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
}

export async function adminOtpSubjectHash(email: string): Promise<string | null> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return null;
  return hashString(`admin:${normalized}`);
}

export function parseAdminEmails(): string[] {
  return String(process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(/[,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string): boolean {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  return parseAdminEmails().includes(normalized);
}
