export type ParsedInstagramComment = {
  commentId: string;
  text: string;
  mediaId: string;
  fromId: string;
  fromUsername: string | null;
  igAccountId: string;
};

export function parseInstagramCommentWebhooks(
  body: unknown,
): ParsedInstagramComment[] {
  if (!body || typeof body !== "object") return [];
  const obj = body as Record<string, unknown>;
  if (obj.object !== "instagram" || !Array.isArray(obj.entry)) {
    return [];
  }

  const out: ParsedInstagramComment[] = [];

  for (const entry of obj.entry) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const igAccountId = String(e.id ?? "");
    if (!igAccountId || !Array.isArray(e.changes)) continue;

    for (const change of e.changes) {
      if (!change || typeof change !== "object") continue;
      const c = change as Record<string, unknown>;
      if (c.field !== "comments" || !c.value || typeof c.value !== "object") {
        continue;
      }
      const v = c.value as Record<string, unknown>;
      const commentId = String(v.id ?? "");
      const text = String(v.text ?? "");
      const media =
        v.media && typeof v.media === "object"
          ? (v.media as Record<string, unknown>)
          : null;
      const mediaId = media ? String(media.id ?? "") : "";
      const from =
        v.from && typeof v.from === "object"
          ? (v.from as Record<string, unknown>)
          : null;
      if (!commentId || !mediaId) continue;

      out.push({
        commentId,
        text,
        mediaId,
        fromId: from ? String(from.id ?? "") : "",
        fromUsername: from ? String(from.username ?? "") || null : null,
        igAccountId,
      });
    }
  }

  return out;
}