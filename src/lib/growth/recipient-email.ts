import dns from "node:dns/promises";

const EMAIL_SYNTAX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const BLOCKED_ADDRESS =
  /example\.|yourorg@|yourdomain\.|@yourdomain\.|noreply|no-reply|donotreply|sentry|wixpress|github\.com|firebase|google\.com|facebook\.com|@2x\.|\.webp$|\.png$|\.jpg$/i;

const PLACEHOLDER_LOCAL =
  /^(yourorg|yourname|your\.email|username|name|email|user|test|sample|placeholder|changeme|xxx)$/i;

const PLACEHOLDER_DOMAIN =
  /^(example\.(com|org|net|edu)|yourdomain\.org|email\.com|domain\.com|company\.com|website\.com|yoursite\.com|test\.com|localhost)$/i;

export type RecipientEmailCheck = {
  ok: boolean;
  reason?: string;
};

export function checkRecipientEmailSyntax(email: string): RecipientEmailCheck {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, reason: "Empty email" };
  if (normalized.length > 254) return { ok: false, reason: "Email too long" };
  if (!EMAIL_SYNTAX.test(normalized)) return { ok: false, reason: "Invalid email format" };
  if (BLOCKED_ADDRESS.test(normalized)) return { ok: false, reason: "Blocked or placeholder address" };

  const [local, domain] = normalized.split("@");
  if (!local || !domain) return { ok: false, reason: "Invalid email format" };
  if (PLACEHOLDER_LOCAL.test(local)) return { ok: false, reason: "Placeholder local part" };
  if (PLACEHOLDER_DOMAIN.test(domain)) return { ok: false, reason: "Placeholder domain" };
  if (local.includes("[" ) || local.includes("]")) return { ok: false, reason: "Template placeholder" };
  if (/\.(webp|png|jpe?g|gif|svg)$/i.test(local)) return { ok: false, reason: "Not a contact email" };

  return { ok: true };
}

const mxCache = new Map<string, boolean>();

/** Domain has MX records that accept mail (rejects null MX). */
export async function domainAcceptsMail(domain: string): Promise<boolean> {
  const key = domain.toLowerCase();
  if (mxCache.has(key)) return mxCache.get(key)!;

  let accepts = false;
  try {
    const mx = await dns.resolveMx(key);
    if (mx.length > 0) {
      const nullMx = mx.some(
        (r) => r.exchange === "." || r.exchange === "" || r.exchange === "0.0.0.0",
      );
      accepts = !nullMx;
    }
  } catch {
    accepts = false;
  }

  mxCache.set(key, accepts);
  return accepts;
}

export async function validateRecipientEmail(email: string): Promise<RecipientEmailCheck> {
  const syntax = checkRecipientEmailSyntax(email);
  if (!syntax.ok) return syntax;

  const domain = email.trim().toLowerCase().split("@")[1]!;
  const accepts = await domainAcceptsMail(domain);
  if (!accepts) {
    return { ok: false, reason: "Domain has no mail server (MX)" };
  }
  return { ok: true };
}

export function extractPlausibleEmails(text: string): string[] {
  const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(EMAIL_RE) ?? [];
  const uniq = new Set<string>();
  for (const raw of found) {
    const email = raw.toLowerCase();
    if (checkRecipientEmailSyntax(email).ok) uniq.add(email);
  }
  return [...uniq];
}
