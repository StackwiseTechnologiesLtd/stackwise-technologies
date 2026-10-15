"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type {
  GrowthDraft,
  GrowthLead,
  GrowthSignal,
} from "@/lib/growth/types";
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
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);
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
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markLeadNotFit(leadId: string) {
    const res = await fetch(`/api/admin/growth/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipelineStatus: "not_a_fit",
        feedbackNote: "Marked not a fit from inbox",
      }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error ?? "Could not update lead");
    }
  }

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
    await load({ silent: true });
  }

  async function runAction(key: string, fn: () => Promise<void>) {
    setBusyKey(key);
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusyKey(null);
    }
  }

  function leadForDraft(draft: GrowthDraft): GrowthLead | undefined {
    return data?.leads.find((l) => l.id === draft.leadId);
  }

  function signalForDraft(draft: GrowthDraft): GrowthSignal | undefined {
    return data?.signals.find((s) => s.id === draft.signalId);
  }

  if (loading && !data) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        Loading inbox…
      </p>
    );
  }

  const pending =
    data?.drafts.filter((d) => d.status === "pending_review") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {pending.length} draft{pending.length === 1 ? "" : "s"} waiting for review
        </p>
        <AdminActionButton
          busy={refreshing}
          busyLabel="Refreshing…"
          onClick={() => void load({ silent: true })}
        >
          Refresh
        </AdminActionButton>
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
            const draftBusy = busyKey?.startsWith(`${draft.id}:`) ?? false;
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
                  disabled={draftBusy}
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <AdminActionButton
                    variant="primary"
                    busy={busyKey === `${draft.id}:approve`}
                    busyLabel="Approving…"
                    disabled={draftBusy && busyKey !== `${draft.id}:approve`}
                    onClick={() =>
                      void runAction(`${draft.id}:approve`, async () => {
                        await patchDraft(draft.id, {
                          bodyText: editing[draft.id],
                          status: "approved",
                        });
                        toast.success("Draft approved");
                      })
                    }
                  >
                    Approve
                  </AdminActionButton>
                  <AdminActionButton
                    busy={busyKey === `${draft.id}:copy`}
                    busyLabel="Copied"
                    disabled={draftBusy && busyKey !== `${draft.id}:copy`}
                    onClick={() =>
                      void runAction(`${draft.id}:copy`, async () => {
                        await navigator.clipboard.writeText(editing[draft.id] ?? "");
                        toast.success("Copied to clipboard");
                      })
                    }
                  >
                    Copy for {draft.platform}
                  </AdminActionButton>
                  <AdminActionButton
                    busy={busyKey === `${draft.id}:posted`}
                    busyLabel="Saving…"
                    disabled={draftBusy && busyKey !== `${draft.id}:posted`}
                    onClick={() =>
                      void runAction(`${draft.id}:posted`, async () => {
                        await patchDraft(draft.id, {
                          bodyText: editing[draft.id],
                          status: "published",
                          markPublished: true,
                        });
                        toast.success("Marked as published (manual post)");
                      })
                    }
                  >
                    Mark posted
                  </AdminActionButton>
                  <AdminActionButton
                    busy={busyKey === `${draft.id}:reject`}
                    busyLabel="Rejecting…"
                    disabled={draftBusy && busyKey !== `${draft.id}:reject`}
                    onClick={() =>
                      void runAction(`${draft.id}:reject`, async () => {
                        await patchDraft(draft.id, { status: "rejected" });
                        toast.toast("Draft rejected");
                      })
                    }
                  >
                    Reject
                  </AdminActionButton>
                  {lead ? (
                    <AdminActionButton
                      busy={busyKey === `${draft.id}:notfit`}
                      busyLabel="Updating…"
                      disabled={draftBusy && busyKey !== `${draft.id}:notfit`}
                      onClick={() =>
                        void runAction(`${draft.id}:notfit`, async () => {
                          await markLeadNotFit(lead.id);
                          await patchDraft(draft.id, { status: "rejected" });
                          toast.success("Lead marked not a fit");
                        })
                      }
                    >
                      Not a fit
                    </AdminActionButton>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
