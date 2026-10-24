"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { GrowthArticleLink } from "@/components/admin/growth/GrowthArticleLink";
import { useToast } from "@/components/ToastProvider";
import {
  GrowthLeadSourceFilter,
  leadSourceBadgeLabel,
  type LeadSourceFilter,
} from "@/components/admin/growth/GrowthLeadSourceFilter";
import {
  GrowthPlatformFilter,
  type PlatformFilter,
} from "@/components/admin/growth/GrowthPlatformFilter";
import {
  GrowthScoreFilter,
  scoreBadgeClass,
} from "@/components/admin/growth/GrowthScoreFilter";
import type { GrowthDraft, GrowthInboxItem, LeadSource } from "@/lib/growth/types";
import { growthFetch } from "@/lib/growth/growth-fetch";
import { INBOX_DEFAULT_FRESHNESS_HOURS } from "@/lib/growth/harvest-config";
import { sortInboxItemsByRecency } from "@/lib/growth/lead-sort";
import { GrowthFreshnessFilter } from "@/components/admin/growth/GrowthFreshnessFilter";
import { PromoteToCrmButton } from "@/components/admin/growth/PromoteToCrmButton";
import { formatShortRelativeTime } from "@/lib/format-relative-time";
import { resolveGrowthPostUrl } from "@/lib/growth/post-url";
import { normalizeDiscoveryKeyword } from "@/lib/growth/personalized-draft";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useMemo, useState } from "react";

function inboxQuery(
  minScore: number,
  platform: PlatformFilter,
  leadSource: LeadSourceFilter,
  freshnessHours: number,
): string {
  const params = new URLSearchParams();
  if (minScore > 0) params.set("minScore", String(minScore));
  if (platform !== "all") params.set("platform", platform);
  if (leadSource !== "all") params.set("leadSource", leadSource);
  if (freshnessHours > 0) {
    params.set("freshnessHours", String(freshnessHours));
  } else {
    params.set("freshnessHours", "0");
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function draftStatusLabel(item: GrowthInboxItem): string {
  const draft = item.draft;
  if (!draft) return "No reply yet";
  if (draft.status === "pending_review" || draft.status === "failed") {
    return draft.status === "failed" ? "Post failed — review" : "Draft ready";
  }
  return draft.status;
}

export type GrowthInboxPanelProps = {
  /** Locks the inbox to one platform and hides the platform filter. */
  fixedPlatform?: Exclude<PlatformFilter, "all">;
  /** Locks the inbox to one lead channel and hides the channel filter. */
  fixedLeadSource?: LeadSource;
};

export function GrowthInboxPanel({
  fixedPlatform,
  fixedLeadSource,
}: GrowthInboxPanelProps = {}) {
  const toast = useToast();
  const [items, setItems] = useState<GrowthInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [platform, setPlatform] = useState<PlatformFilter>(
    fixedPlatform ?? "all",
  );
  const [freshnessHours, setFreshnessHours] = useState(
    INBOX_DEFAULT_FRESHNESS_HOURS,
  );
  const [leadSource, setLeadSource] = useState<LeadSourceFilter>(
    fixedLeadSource ?? "all",
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const platformFilter: PlatformFilter = fixedPlatform ?? platform;
  const leadSourceFilter: LeadSourceFilter = fixedLeadSource ?? leadSource;

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await growthFetch(
          `/api/admin/growth/inbox${inboxQuery(minScore, platformFilter, leadSourceFilter, freshnessHours)}`,
        );
        if (!res.ok) throw new Error("Could not load inbox");
        const json = (await res.json()) as { items: GrowthInboxItem[] };
        const sorted = sortInboxItemsByRecency(json.items);
        setItems(sorted);
        const next: Record<string, string> = {};
        for (const item of sorted) {
          if (item.draft) next[item.draft.id] = item.draft.bodyText;
        }
        setEditing(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Load failed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast, minScore, platformFilter, leadSourceFilter, freshnessHours],
  );

  const linkedInInbox = fixedPlatform === "linkedin";
  const jobsInbox = fixedLeadSource === "freehire";

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const sortedItems = useMemo(() => items, [items]);

  function toggleExpanded(leadId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }

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

  if (loading && items.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        Loading inbox…
      </p>
    );
  }

  const needsReply = sortedItems.filter(
    (i) =>
      !i.draft ||
      i.draft.status === "pending_review" ||
      i.draft.status === "failed",
  ).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-gradient-to-br from-panel/90 to-black/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight">
            {jobsInbox
              ? "Jobs inbox"
              : linkedInInbox
                ? "LinkedIn inbox"
                : "Lead inbox"}
          </p>
          <p className="text-sm text-muted">
            {sortedItems.length} lead{sortedItems.length === 1 ? "" : "s"}
            {needsReply > 0
              ? ` · ${needsReply} awaiting reply`
              : ""}{" "}
            · newest first
            {freshnessHours > 0
              ? ` · last ${freshnessHours <= 24 ? "24h" : freshnessHours <= 72 ? "72h" : `${Math.round(freshnessHours / 24)}d`}`
              : ""}
          </p>
          <p className="mt-1 max-w-xl text-xs text-muted">
            {jobsInbox
              ? "Job postings from freehire. Qualified roles sync to CRM as Hiring opportunities."
              : linkedInInbox
                ? "Expand a lead to draft a comment, then copy and paste it on the LinkedIn post. Mark posted when you are done."
                : "Expand a lead to read the post and generate a reply. Use the LinkedIn tab for comment workflows; X supports one-click post from here."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {fixedPlatform ? null : (
            <GrowthPlatformFilter value={platform} onChange={setPlatform} />
          )}
          {fixedLeadSource ? null : (
            <GrowthLeadSourceFilter value={leadSource} onChange={setLeadSource} />
          )}
          <GrowthFreshnessFilter
            freshnessHours={freshnessHours}
            onChange={setFreshnessHours}
          />
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
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-12 text-center">
          <p className="text-sm text-muted">
            {linkedInInbox
              ? "No LinkedIn leads match this filter. Run LinkedIn harvest below, or check Inbox (All) if leads were captured before platform tagging."
              : "No leads for this filter. Run harvest or loosen the score / source filters."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedItems.map((item) => {
            const { lead, signal, draft } = item;
            const isOpen = expanded.has(lead.id);
            const score = lead.compositeScore;
            const draftBusy =
              draft && busyKey?.startsWith(`${draft.id}:`) ? true : busyKey === `${lead.id}:generate`;
            const articleUrl =
              lead.sourceUrl?.trim() ||
              signal?.sourceUrl?.trim() ||
              resolveGrowthPostUrl({
                platform: lead.platform ?? signal?.platform,
                sourceUrl: null,
                authorProfileUrl:
                  signal?.authorProfileUrl ?? lead.profileUrl,
                authorHandle: signal?.authorHandle ?? null,
              });
            const activityTime = formatShortRelativeTime(
              signal?.postedAt ?? signal?.ingestedAt ?? lead.createdAt,
            );

            return (
              <li
                key={lead.id}
                className="overflow-hidden rounded-2xl border border-line bg-panel/60 shadow-sm shadow-black/20"
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-black/20"
                  onClick={() => toggleExpanded(lead.id)}
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[10px] text-muted tabular-nums">
                        {[
                          activityTime,
                          leadSourceBadgeLabel(lead.leadSource),
                          `${score}% fit`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted">
                        {lead.platform ?? "unknown"}
                      </span>
                      <span className="rounded-md bg-black/40 px-2 py-0.5 text-[10px] text-muted ring-1 ring-line">
                        {draftStatusLabel(item)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-base font-semibold tracking-tight">
                      {lead.fullName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {[lead.roleTitle, lead.companyName]
                        .filter(Boolean)
                        .join(" · ") || signal?.bodyText?.slice(0, 80)}
                    </p>
                    {articleUrl ? (
                      <p className="mt-1.5">
                        <GrowthArticleLink
                          href={articleUrl}
                          platform={lead.platform ?? signal?.platform}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-muted">
                        No post link saved — re-harvest or add a URL when capturing.
                      </p>
                    )}
                  </div>
                  <span
                    className="mt-1 shrink-0 text-muted"
                    aria-hidden
                  >
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-line">
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                      <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
                        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                          <PromoteToCrmButton leadId={lead.id} />
                          {lead.profileUrl ? (
                            <a
                              href={lead.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              Profile
                            </a>
                          ) : null}
                          {articleUrl ? (
                            <GrowthArticleLink
                              href={articleUrl}
                              platform={lead.platform}
                            />
                          ) : null}
                        </div>

                        {lead.profileSummary ? (
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

                        {lead.scoreReasons.length ? (
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
                        {!draft ? (
                          <div className="flex flex-1 flex-col items-start justify-center gap-3 py-6">
                            <p className="text-sm text-muted">
                              No reply drafted yet. Generate one with OpenRouter
                              (or template fallback) when you want to respond.
                            </p>
                            <AdminActionButton
                              variant="primary"
                              busy={busyKey === `${lead.id}:generate`}
                              busyLabel="Generating…"
                              disabled={draftBusy}
                              onClick={() =>
                                void runAction(`${lead.id}:generate`, async () => {
                                  const res = await growthFetch(
                                    `/api/admin/growth/leads/${lead.id}/generate-draft`,
                                    { method: "POST" },
                                  );
                                  const json = (await res.json()) as {
                                    draft?: GrowthDraft;
                                    usedAi?: boolean;
                                    aiError?: string;
                                    error?: string;
                                  };
                                  if (!res.ok) {
                                    throw new Error(
                                      json.error ?? "Generate failed",
                                    );
                                  }
                                  if (json.draft) {
                                    setEditing((prev) => ({
                                      ...prev,
                                      [json.draft!.id]: json.draft!.bodyText,
                                    }));
                                  }
                                  if (json.aiError) {
                                    toast.error(`OpenRouter: ${json.aiError}`);
                                  } else if (json.usedAi) {
                                    toast.success("Reply generated with AI");
                                  } else {
                                    toast.toast(
                                      "Generated with template (low score or no API key)",
                                    );
                                  }
                                  await load({ silent: true });
                                  setExpanded((prev) => new Set(prev).add(lead.id));
                                })
                              }
                            >
                              Generate reply
                            </AdminActionButton>
                          </div>
                        ) : (
                          <>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                              {draft.platform === "x"
                                ? "Tweet reply (≤280 chars)"
                                : draft.platform === "linkedin"
                                  ? "LinkedIn comment"
                                  : "Draft reply"}
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

                            {draft.publishError ? (
                              <p className="mt-2 text-xs text-amber-200/90">
                                Last post error: {draft.publishError}
                              </p>
                            ) : null}

                            {draft.platform === "x" &&
                            (editing[draft.id] ?? draft.bodyText).length > 280 ? (
                              <p className="mt-2 text-xs text-amber-200/90">
                                {(editing[draft.id] ?? draft.bodyText).length}
                                /280 characters — shorten before posting to X
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {draft.platform === "linkedin" && articleUrl ? (
                                <AdminActionButton
                                  variant="primary"
                                  busy={busyKey === `${draft.id}:linkedin`}
                                  busyLabel="Opening…"
                                  disabled={
                                    draftBusy &&
                                    busyKey !== `${draft.id}:linkedin`
                                  }
                                  onClick={() =>
                                    void runAction(
                                      `${draft.id}:linkedin`,
                                      async () => {
                                        const text =
                                          editing[draft.id] ?? draft.bodyText;
                                        await navigator.clipboard.writeText(
                                          text,
                                        );
                                        window.open(
                                          articleUrl,
                                          "_blank",
                                          "noopener,noreferrer",
                                        );
                                        toast.success(
                                          "Comment copied — paste on LinkedIn",
                                        );
                                      },
                                    )
                                  }
                                >
                                  Copy & open post
                                </AdminActionButton>
                              ) : null}
                              {draft.platform === "x" && signal?.sourceUrl ? (
                                <AdminActionButton
                                  variant="primary"
                                  busy={busyKey === `${draft.id}:publish`}
                                  busyLabel="Posting…"
                                  disabled={
                                    (draftBusy &&
                                      busyKey !== `${draft.id}:publish`) ||
                                    (editing[draft.id] ?? draft.bodyText).length >
                                      280
                                  }
                                  onClick={() =>
                                    void runAction(`${draft.id}:publish`, async () => {
                                      const res = await growthFetch(
                                        `/api/admin/growth/drafts/${draft.id}/publish`,
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            bodyText:
                                              editing[draft.id] ?? draft.bodyText,
                                          }),
                                        },
                                      );
                                      const json = (await res.json()) as {
                                        error?: string;
                                      };
                                      if (!res.ok) {
                                        throw new Error(json.error ?? "Post failed");
                                      }
                                      toast.success("Reply posted on X");
                                      await load({ silent: true });
                                    })
                                  }
                                >
                                  Post reply on X
                                </AdminActionButton>
                              ) : null}
                              <AdminActionButton
                                busy={busyKey === `${draft.id}:approve`}
                                busyLabel="Approving…"
                                disabled={
                                  draftBusy && busyKey !== `${draft.id}:approve`
                                }
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
                                disabled={
                                  draftBusy && busyKey !== `${draft.id}:regen`
                                }
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
                                      throw new Error(
                                        json.error ?? "Regenerate failed",
                                      );
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
                                      toast.toast(
                                        "Regenerated with template (low score or no API key)",
                                      );
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
                                disabled={
                                  draftBusy && busyKey !== `${draft.id}:copy`
                                }
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
                                disabled={
                                  draftBusy && busyKey !== `${draft.id}:posted`
                                }
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
                                disabled={
                                  draftBusy && busyKey !== `${draft.id}:reject`
                                }
                                onClick={() =>
                                  void runAction(`${draft.id}:reject`, async () => {
                                    await patchDraft(draft.id, {
                                      status: "rejected",
                                    });
                                    toast.toast("Draft rejected");
                                  })
                                }
                              >
                                Reject
                              </AdminActionButton>
                              <AdminActionButton
                                busy={busyKey === `${lead.id}:notfit`}
                                busyLabel="Updating…"
                                disabled={
                                  draftBusy && busyKey !== `${lead.id}:notfit`
                                }
                                onClick={() =>
                                  void runAction(`${lead.id}:notfit`, async () => {
                                    await markLeadNotFit(lead.id);
                                    if (draft) {
                                      await patchDraft(draft.id, {
                                        status: "rejected",
                                      });
                                    }
                                    toast.success("Lead marked not a fit");
                                  })
                                }
                              >
                                Not a fit
                              </AdminActionButton>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
