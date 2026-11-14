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

export function renderInstagramTemplate(
  template: string,
  vars: { username?: string | null },
): string {
  const handle = vars.username?.replace(/^@/, "") ?? "there";
  return template.replace(/\{username\}/gi, handle);
}