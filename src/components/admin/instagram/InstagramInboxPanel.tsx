"use client";

import { useToast } from "@/components/ToastProvider";
import type {
  InstagramConversation,
  InstagramInboxMessage,
} from "@/lib/instagram/types";
import { BTN_PRIMARY } from "@/lib/ui/buttons";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function InstagramInboxPanel() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [conversations, setConversations] = useState<InstagramConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InstagramInboxMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/instagram/conversations");
      if (!res.ok) throw new Error("Could not load conversations");
      const data = (await res.json()) as { conversations: InstagramConversation[] };
      setConversations(data.conversations);
      setSelectedId((prev) => prev ?? data.conversations[0]?.id ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  const loadThread = useCallback(
    async (conversationId: string) => {
      setLoadingThread(true);
      try {
        const res = await fetch(
          `/api/admin/instagram/conversations/${conversationId}/messages`,
        );
        if (!res.ok) throw new Error("Could not load thread");
        const data = (await res.json()) as { messages: InstagramInboxMessage[] };
        setMessages(data.messages);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Load failed");
        setMessages([]);
      } finally {
        setLoadingThread(false);
      }
    },
    [toast],
  );

  useDeferredEffect(() => {
    void loadList();
  }, [loadList]);

  useDeferredEffect(() => {
    const accountId = searchParams.get("accountId")?.trim();
    const participantIgsid = searchParams.get("participantIgsid")?.trim();
    if (!accountId || !participantIgsid) return;
    void (async () => {
      try {
        const qs = new URLSearchParams({ accountId, participantIgsid });
        const res = await fetch(`/api/admin/instagram/conversations?${qs}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          conversation?: InstagramConversation | null;
        };
        if (data.conversation?.id) setSelectedId(data.conversation.id);
      } catch {
        /* deep link optional */
      }
    })();
  }, [searchParams]);

  useDeferredEffect(() => {
    if (selectedId) void loadThread(selectedId);
  }, [selectedId, loadThread]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !compose.trim()) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/instagram/conversations/${selectedId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: compose.trim() }),
        },
      );
      const data = (await res.json()) as { error?: string; hint?: string; dryRun?: boolean };
      if (!res.ok) {
        throw new Error(
          [data.error, data.hint].filter(Boolean).join(" — ") || "Send failed",
        );
      }
      setCompose("");
      if (data.dryRun) {
        toast.toast("Dry run: message stored but not sent to Meta.");
      } else {
        toast.toast("Message sent.");
      }
      await loadThread(selectedId);
      await loadList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Threads sync from Meta <code className="text-xs">messages</code> webhooks. Manual
        replies use the Instagram messaging API and must fall inside the active messaging
        window.
      </p>

      <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(12rem,16rem)_1fr]">
        <aside className="rounded-xl border border-line bg-panel">
          <div className="border-b border-line px-3 py-2 text-xs font-medium text-muted">
            Conversations
          </div>
          <ul className="max-h-[26rem] overflow-y-auto">
            {loadingList ? (
              <li className="px-3 py-4 text-sm text-muted">Loading…</li>
            ) : conversations.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted">
                No threads yet. Inbound DMs appear here after webhooks deliver.
              </li>
            ) : (
              conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full border-b border-line/60 px-3 py-3 text-left text-sm transition-colors hover:bg-white/5 ${
                      selectedId === c.id ? "bg-white/8" : ""
                    }`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <span className="block font-medium">
                      {c.participantUsername ? `@${c.participantUsername}` : c.participantIgsid}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {c.lastMessagePreview || "—"}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      {formatWhen(c.lastMessageAt)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section className="flex min-h-[28rem] flex-col rounded-xl border border-line bg-panel">
          {selected ? (
            <>
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold">
                  {selected.participantUsername
                    ? `@${selected.participantUsername}`
                    : selected.participantIgsid}
                </p>
                <p className="text-xs text-muted">IGSID {selected.participantIgsid}</p>
              </div>
              <ul className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
                {loadingThread ? (
                  <li className="text-sm text-muted">Loading messages…</li>
                ) : messages.length === 0 ? (
                  <li className="text-sm text-muted">No messages in this thread yet.</li>
                ) : (
                  messages.map((m) => (
                    <li
                      key={m.id}
                      className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <MessageBubble message={m} />
                    </li>
                  ))
                )}
              </ul>
              <form
                onSubmit={sendReply}
                className="flex gap-2 border-t border-line p-3"
              >
                <textarea
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  rows={2}
                  placeholder="Reply within the messaging window…"
                  className="min-h-[2.5rem] flex-1 resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !compose.trim()}
                  className={`self-end px-4 py-2 ${BTN_PRIMARY}`}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </form>
            </>
          ) : (
            <p className="flex flex-1 items-center justify-center text-sm text-muted">
              Select a conversation
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function MessageBubble({ message: m }: { message: InstagramInboxMessage }) {
  const failed = m.sendStatus === "failed";
  return (
    <div
      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
        m.direction === "outbound"
          ? failed
            ? "border border-red-500/40 bg-red-500/10"
            : "bg-accent/20"
          : "border border-line bg-background"
      }`}
    >
      <p className="whitespace-pre-wrap">{m.bodyText ?? ""}</p>
      <p className="mt-1 text-[10px] text-muted">
        {formatWhen(m.createdAt)}
        {m.direction === "outbound" && m.sendStatus ? ` · ${m.sendStatus}` : ""}
        {failed && m.errorDetail ? ` — ${m.errorDetail}` : ""}
        {m.deliveryId ? " · automation" : ""}
      </p>
    </div>
  );
}