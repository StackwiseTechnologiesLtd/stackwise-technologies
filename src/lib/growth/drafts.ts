import { bookingUrl } from "@/lib/booking";
import { fitXReply, shortBookingUrlForX } from "@/lib/growth/x-reply-format";
import type { GrowthPlatform } from "@/lib/growth/types";

export function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "there";
}

function topicFromPost(bodyText: string): string {
  const line =
    bodyText
      .trim()
      .split(/\n/)
      .map((l) => l.trim())
      .find((l) => l.length >= 12) ?? bodyText.trim();
  return line.slice(0, 120).replace(/\s+/g, " ");
}

export function buildReplyDraft(input: {
  authorName: string;
  bodyText: string;
  platform?: GrowthPlatform;
}): string {
  if (input.platform === "x") {
    const topic = topicFromPost(input.bodyText);
    const booking = shortBookingUrlForX();
    const body = `On ${topic.slice(0, 90)} — we help founders take MVPs to production without throwing away what's already built. Open to chat if useful.`;
    return fitXReply(`${body}\n${booking}`);
  }

  const name = firstName(input.authorName);
  const topic = topicFromPost(input.bodyText);

  return `Hi ${name}, I saw your post about ${topic}.

We help founders take quick-built MVPs to production (code, cloud, UX) without throwing away what already works. If a short call would help, my calendar is here: ${bookingUrl()}`;
}

export function buildPostDraft(input: { theme: string }): string {
  return `${input.theme}

We ship and harden software for teams that moved fast first: production infra, UX polish, and the boring reliability work after the demo.

${bookingUrl()}`;
}
