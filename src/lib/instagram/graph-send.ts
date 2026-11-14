const GRAPH_VERSION = "v21.0";

type GraphError = {
  message?: string;
  type?: string;
  code?: number;
};

export async function sendInstagramPrivateReply(input: {
  commentId: string;
  message: string;
  accessToken: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const url = new URL(
    `https://graph.instagram.com/${GRAPH_VERSION}/${encodeURIComponent(input.commentId)}/private_replies`,
  );
  url.searchParams.set("access_token", input.accessToken);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input.message }),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as GraphError | undefined;
    const detail = err?.message ?? res.statusText;
    return { ok: false, error: detail };
  }

  const messageId = String(json.id ?? json.message_id ?? "unknown");
  return { ok: true, messageId };
}

export async function sendInstagramPublicCommentReply(input: {
  commentId: string;
  message: string;
  accessToken: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = new URL(
    `https://graph.instagram.com/${GRAPH_VERSION}/${encodeURIComponent(input.commentId)}/replies`,
  );
  url.searchParams.set("access_token", input.accessToken);
  url.searchParams.set("message", input.message);

  const res = await fetch(url.toString(), { method: "POST" });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as GraphError | undefined;
    return { ok: false, error: err?.message ?? res.statusText };
  }
  return { ok: true };
}

export async function sendInstagramDirectMessage(input: {
  igAccountId: string;
  recipientIgsid: string;
  message: string;
  accessToken: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const url = new URL(
    `https://graph.instagram.com/${GRAPH_VERSION}/${encodeURIComponent(input.igAccountId)}/messages`,
  );
  url.searchParams.set("access_token", input.accessToken);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: input.recipientIgsid },
      message: { text: input.message },
    }),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as GraphError | undefined;
    return { ok: false, error: err?.message ?? res.statusText };
  }
  const messageId = String(json.message_id ?? json.id ?? "unknown");
  return { ok: true, messageId };
}

export function isInstagramDryRun(): boolean {
  return process.env.INSTAGRAM_DRY_RUN === "1";
}