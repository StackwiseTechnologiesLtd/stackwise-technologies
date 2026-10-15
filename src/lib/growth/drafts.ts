import { bookingUrl } from "@/lib/booking";

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
  return line.slice(0, 140).replace(/\s+/g, " ");
}

export function buildReplyDraft(input: {
  authorName: string;
  bodyText: string;
}): string {
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
