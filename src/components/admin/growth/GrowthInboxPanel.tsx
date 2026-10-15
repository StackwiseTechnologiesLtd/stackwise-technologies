"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import {
  GrowthScoreFilter,
  scoreBadgeClass,
} from "@/components/admin/growth/GrowthScoreFilter";
import type {
  GrowthDraft,
  GrowthLead,
  GrowthSignal,
} from "@/lib/growth/types";
import { growthFetch } from "@/lib/growth/growth-fetch";
import { sortDraftsByLeadScore } from "@/lib/growth/lead-sort";
import { normalizeDiscoveryKeyword } from "@/lib/growth/personalized-draft";
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
  const [minScore, setMinScore] = useState(0);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      try {
        const qs = minScore > 0 ? `?minScore=${minScore}` : "";
        const res = await growthFetch(`/api/admin/growth/inbox${qs}`);
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
    },
    [toast, minScore],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function markLeadNotFit(leadId: string) {
    const res = await growthFetch(`/api/admin/growth/leads/${leadId}`, {
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
    const res = await growthFetch(`/api/admin/growth/drafts/${id}`, {
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

  const pending = data
    ? sortDraftsByLeadScore(
        data.drafts.filter((d) => d.status === "pending_review"),
        data.leads,
      )
    : [];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-gradient-to-br from-panel/90 to-black/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight">Review queue</p>
          <p className="text-sm text-muted">
            {pending.length} personalized draft{pending.length === 1 ? "" : "s"}{" "}
            ready · highest fit first
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GrowthScoreFilter minScore={minScore} onChange={setMinScore} />
          <AdminActionButton
            busy={refreshing}
            busyLabel="Refreshing…"
            onClick={() => void load({ silent: true })}
          >
            Refresh
          </AdminActionButton>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-12 text-center">
          <p className="text-sm text-muted">
            No drafts in the queue. Run harvest or capture a signal from settings.
          </p>
        </div>
      ) : (
        <ul className="space-y-5">
          {pending.map((draft) => {
            const lead = leadForDraft(draft);
            const signal = signalForDraft(draft);
            const draftBusy = busyKey?.startsWith(`${draft.id}:`) ?? false;
            const score = lead?.compositeScore ?? 0;

            return (
              <li
                key={draft.id}
                className="overflow-hidden rounded-2xl border border-line bg-panel/60 shadow-sm shadow-black/20"
              >
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                  <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted">
                            {draft.platform}
                          </span>
                          {lead ? (
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ring-1 ${scoreBadgeClass(score)}`}
                            >
                              {score}% fit
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xl font-semibold tracking-tight">
                          {lead?.fullName ?? "Unknown lead"}
                        </p>
                        {lead?.roleTitle || lead?.companyName ? (
                          <p className="text-sm text-muted">
                            {[lead?.roleTitle, lead?.companyName]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right text-xs">
                        {lead?.profileUrl ? (
                          <a
                            href={lead.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            Profile
                          </a>
                        ) : null}
                        {signal?.sourceUrl ? (
                          <a
                            href={signal.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            Original post
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {lead?.profileSummary ? (
                      <div className="mt-4 rounded-xl bg-black/35 p-3 ring-1 ring-white/5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          Profile research
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {lead.profileSummary.slice(0, 500)}
                          {lead.profileSummary.length > 500 ? "…" : ""}
                        </p>
                      </div>
                    ) : null}

                    {signal?.bodyText ? (
                      <blockquote className="mt-4 rounded-xl border border-white/6 bg-black/30 p-3 text-sm leading-relaxed text-muted">
                        {signal.bodyText.slice(0, 420)}
                        {signal.bodyText.length > 420 ? "…" : ""}
                      </blockquote>
                    ) : null}

                    {signal?.contextSummary &&
                    normalizeDiscoveryKeyword(signal.contextSummary) ? (
                      <p className="mt-2 text-[10px] text-muted">
                        Matched keyword:{" "}
                        <span className="text-foreground/80">
                          {normalizeDiscoveryKeyword(signal.contextSummary)}
                        </span>
                      </p>
                    ) : null}

                    {lead?.scoreReasons.length ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {lead.scoreReasons.slice(0, 5).map((reason) => (
                          <li
                            key={reason}
                            className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] text-muted ring-1 ring-line"
                          >
                            {reason}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="flex flex-col p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Draft reply
                    </p>
                    <textarea
                      className="mt-2 min-h-[11rem] flex-1 w-full rounded-xl border border-line bg-black/45 px-3 py-2.5 text-sm leading-relaxed text-foreground"
                      value={editing[draft.id] ?? draft.bodyText}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [draft.id]: e.target.value,
                        }))
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
                        busy={busyKey === `${draft.id}:regen`}
                        busyLabel="Regenerating…"
                        disabled={draftBusy && busyKey !== `${draft.id}:regen`}
                        onClick={() =>
                          void runAction(`${draft.id}:regen`, async () => {
                            const res = await growthFetch(
                              `/api/admin/growth/drafts/${draft.id}/regenerate`,
                              { method: "POST" },
                            );
                            const json = (await res.json()) as {
                              draft?: GrowthDraft;
                              usedAi?: boolean;
                              aiError?: string;
                              error?: string;
                            };
                            if (!res.ok) {
                              throw new Error(json.error ?? "Regenerate failed");
                            }
                            if (json.draft) {
                              setEditing((prev) => ({
                                ...prev,
                                [draft.id]: json.draft!.bodyText,
                              }));
                            }
                            if (json.aiError) {
                              toast.error(`OpenRouter: ${json.aiError}`);
                            } else if (json.usedAi) {
                              toast.success("Draft regenerated with AI");
                            } else {
                              toast.toast("Regenerated with template (low score or no API key)");
                            }
                            await load({ silent: true });
                          })
                        }
                      >
                        Regenerate AI
                      </AdminActionButton>
                      <AdminActionButton
                        busy={busyKey === `${draft.id}:copy`}
                        busyLabel="Copied"
                        disabled={draftBusy && busyKey !== `${draft.id}:copy`}
                        onClick={() =>
                          void runAction(`${draft.id}:copy`, async () => {
                            await navigator.clipboard.writeText(
                              editing[draft.id] ?? "",
                            );
                            toast.success("Copied to clipboard");
                          })
                        }
                      >
                        Copy
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
                            toast.success("Marked as published");
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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
