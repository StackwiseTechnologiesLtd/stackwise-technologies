export type ParsedInstagramInboundMessage = {
  messageId: string;
  text: string;
  fromId: string;
  fromUsername: string | null;
  igAccountId: string;
  triggerType: "dm" | "story_reply";
};

function parseMessageValue(
  igAccountId: string,
  value: Record<string, unknown>,
): ParsedInstagramInboundMessage | null {
  const sender =
    value.sender && typeof value.sender === "object"
      ? (value.sender as Record<string, unknown>)
      : null;
  const message =
    value.message && typeof value.message === "object"
      ? (value.message as Record<string, unknown>)
      : null;
  if (!sender || !message) return null;

  const messageId = String(message.mid ?? message.id ?? "");
  const text = String(message.text ?? "").trim();
  const fromId = String(sender.id ?? "");
  if (!messageId || !fromId) return null;

  const replyTo =
    message.reply_to && typeof message.reply_to === "object"
      ? (message.reply_to as Record<string, unknown>)
      : null;
  const isStory = Boolean(replyTo?.story);

  return {
    messageId,
    text,
    fromId,
    fromUsername: sender.username ? String(sender.username) : null,
    igAccountId,
    triggerType: isStory ? "story_reply" : "dm",
  };
}

export function parseInstagramInboundMessages(body: unknown): ParsedInstagramInboundMessage[] {
  if (!body || typeof body !== "object") return [];
  const obj = body as Record<string, unknown>;
  if (obj.object !== "instagram" || !Array.isArray(obj.entry)) {
    return [];
  }

  const out: ParsedInstagramInboundMessage[] = [];

  for (const entry of obj.entry) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const igAccountId = String(e.id ?? "");
    if (!igAccountId) continue;

    if (Array.isArray(e.messaging)) {
      for (const row of e.messaging) {
        if (!row || typeof row !== "object") continue;
        const m = row as Record<string, unknown>;
        const parsed = parseMessageValue(igAccountId, m);
        if (parsed) out.push(parsed);
      }
    }

    if (Array.isArray(e.changes)) {
      for (const change of e.changes) {
        if (!change || typeof change !== "object") continue;
        const c = change as Record<string, unknown>;
        if (c.field !== "messages" || !c.value || typeof c.value !== "object") {
          continue;
        }
        const parsed = parseMessageValue(igAccountId, c.value as Record<string, unknown>);
        if (parsed) out.push(parsed);
      }
    }
  }

  return out;
}