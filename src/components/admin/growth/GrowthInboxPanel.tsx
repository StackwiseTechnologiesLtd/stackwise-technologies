"use client";

import { useToast } from "@/components/ToastProvider";
import type {
  GrowthDraft,
  GrowthLead,
  GrowthSignal,
} from "@/lib/growth/types";
import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import { useCallback, useEffect, useState } from "react";

type InboxPayload = {
  drafts: GrowthDraft[];
  leads: GrowthLead[];
  signals: GrowthSignal[];
};

export function GrowthInboxPanel() {
  const toast = useToast();
  const [data, setData] = useState<InboxPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/growth/inbox");
      if (!res.ok) throw new Error("Could not load inbox");
      const json = (await res.json()) as InboxPayload;
      setData(json);
      const next: Record<string, string> = {};
      for (const draft of json.drafts) {
        next[draft.id] = draft.bodyText;
      }
      setEditing(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchDraft(
    id: string,
    patch: {
      bodyText?: string;
      status?: GrowthDraft["status"];
      markPublished?: boolean;
    },
  ) {
    const res = await fetch(`/api/admin/growth/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error ?? "Update failed");
    }
    await load();
  }

  function leadForDraft(draft: GrowthDraft): GrowthLead | undefined {
    return data?.leads.find((l) => l.id === draft.leadId);
  }

  function signalForDraft(draft: GrowthDraft): GrowthSignal | undefined {
    return data?.signals.find((s) => s.id === draft.signalId);
  }

  if (loading && !data) {
    return <p className="text-sm text-muted">Loading inbox…</p>;
  }

  const pending =
    data?.drafts.filter((d) => d.status === "pending_review") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {pending.length} draft{pending.length === 1 ? "" : "s"} waiting for review
        </p>
        <button type="button" className={ADMIN_BTN_SECONDARY} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-line bg-panel p-8 text-center text-sm text-muted">
          No drafts in the queue. Add a signal from the capture form or run the local connector.
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((draft) => {
            const lead = leadForDraft(draft);
            const signal = signalForDraft(draft);
            return (
              <li
                key={draft.id}
                className="rounded-xl border border-line bg-panel p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {draft.platform} · reply
                      {lead ? ` · ${lead.compositeScore}% fit` : ""}
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight">
                      {lead?.fullName ?? "Unknown lead"}
                    </p>
                    {lead?.roleTitle ? (
                      <p className="text-sm text-muted">{lead.roleTitle}</p>
                    ) : null}
                  </div>
                  {signal?.sourceUrl ? (
                    <a
                      href={signal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      View post
                    </a>
                  ) : null}
                </div>

                {lead?.scoreReasons.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
                    {lead.scoreReasons.slice(0, 4).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : null}

                {signal?.bodyText ? (
                  <blockquote className="mt-4 rounded-lg border border-white/8 bg-black/40 p-3 text-sm text-muted">
                    {signal.bodyText.slice(0, 400)}
                    {signal.bodyText.length > 400 ? "…" : ""}
                  </blockquote>
                ) : null}

                <textarea
                  className="mt-4 min-h-32 w-full rounded-lg border border-line bg-black/50 px-3 py-2 text-sm text-foreground"
                  value={editing[draft.id] ?? draft.bodyText}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [draft.id]: e.target.value }))
                  }
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={ADMIN_BTN_PRIMARY}
                    onClick={() => {
                      void (async () => {
                        try {
                          await patchDraft(draft.id, {
                            bodyText: editing[draft.id],
                            status: "approved",
                          });
                          toast.success("Draft approved");
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "Failed",
                          );
                        }
                      })();
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={ADMIN_BTN_SECONDARY}
                    onClick={() => {
                      void navigator.clipboard.writeText(editing[draft.id] ?? "");
                      toast.success("Copied to clipboard");
                    }}
                  >
                    Copy for {draft.platform}
                  </button>
                  <button
                    type="button"
                    className={ADMIN_BTN_SECONDARY}
                    onClick={() => {
                      void (async () => {
                        try {
                          await patchDraft(draft.id, {
                            bodyText: editing[draft.id],
                            status: "published",
                            markPublished: true,
                          });
                          toast.success("Marked as published (manual post)");
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "Failed",
                          );
                        }
                      })();
                    }}
                  >
                    Mark posted
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground"
                    onClick={() => {
                      void (async () => {
                        try {
                          await patchDraft(draft.id, { status: "rejected" });
                          toast.toast("Draft rejected");
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "Failed",
                          );
                        }
                      })();
                    }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
