import { bookingUrl } from "@/lib/booking";
import type { GrowthPlatform } from "@/lib/growth/types";

export const X_REPLY_MAX_LENGTH = 280;

/** Shorter Cal link so more room for reply copy on X. */
export function shortBookingUrlForX(): string {
  const full = bookingUrl();
  try {
    const u = new URL(full);
    return `${u.origin}${u.pathname}`;
  } catch {
    return "https://cal.com/stackwise-technologies/30min";
  }
}

function stripColdDmPhrasing(text: string): string {
  const lines = text
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^hi\s+[^,]{1,40},\s*/i, "")
        .replace(/^hey\s+[^,]{1,40},\s*/i, "")
        .replace(/hope this (finds you well|email finds you)[.!]?\s*/gi, "")
        .replace(/i saw your post about\s+/gi, ""),
    )
    .filter(Boolean);
  return lines.join("\n").trim();
}

/** Fit text to X limit; keeps cal.com link on the last line when possible. */
export function fitXReply(raw: string, booking = shortBookingUrlForX()): string {
  const calMatch = raw.match(/https?:\/\/[^\s]*cal\.com[^\s]*/i);
  const linkLine = calMatch?.[0]?.trim() || booking;
  let body = stripColdDmPhrasing(
    raw.replace(/https?:\/\/[^\s]*cal\.com[^\s]*/gi, "").trim(),
  );
  body = body.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

  if (!body) {
    body = "Worth comparing notes on the production side — we help founders harden MVPs without a rewrite.";
  }

  const separator = "\n";
  const budgetForBody = X_REPLY_MAX_LENGTH - separator.length - linkLine.length;
  if (budgetForBody < 40) {
    return linkLine.slice(0, X_REPLY_MAX_LENGTH);
  }
  if (body.length > budgetForBody) {
    body = `${body.slice(0, budgetForBody - 1).trimEnd()}…`;
  }

  return `${body}${separator}${linkLine}`;
}

export function finalizeReplyForPlatform(
  platform: GrowthPlatform,
  raw: string,
): string {
  const trimmed = raw.trim();
  if (platform !== "x") return trimmed;
  return fitXReply(trimmed);
}

export function isWithinXLimit(text: string): boolean {
  return text.length <= X_REPLY_MAX_LENGTH;
}
