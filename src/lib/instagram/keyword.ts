import type { InstagramCampaignTrigger } from "@/lib/instagram/types";

/** Comment contains keyword as a whole token (case-insensitive). */
export function commentMatchesKeyword(
  commentText: string,
  keyword: string,
): boolean {
  const k = keyword.trim();
  if (!k) return false;
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$|[!.,?])`, "i");
  return re.test(commentText.trim()) || commentText.trim().toUpperCase() === k.toUpperCase();
}

/** Campaign trigger keyword match (always case-insensitive; DM/story allow substring). */
export function triggerMatchesKeyword(
  triggerType: InstagramCampaignTrigger,
  text: string,
  keyword: string,
): boolean {
  if (triggerType === "comment") {
    return commentMatchesKeyword(text, keyword);
  }
  const k = keyword.trim();
  if (!k) return false;
  const t = text.trim();
  if (!t) return false;
  const lowerK = k.toLowerCase();
  const lowerT = t.toLowerCase();
  return lowerT === lowerK || lowerT.includes(lowerK);
}

export function renderInstagramTemplate(
  template: string,
  vars: { username?: string | null },
): string {
  const handle = vars.username?.replace(/^@/, "") ?? "there";
  return template.replace(/\{username\}/gi, handle);
}