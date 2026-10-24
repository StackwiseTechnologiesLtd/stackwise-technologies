"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import { crmStageLabels } from "@/lib/crm/types";
import type { CrmOpportunity } from "@/lib/crm/types";
import type { PipelineStatus } from "@/lib/growth/types";
import { leadSourceBadgeLabel } from "@/components/admin/growth/GrowthLeadSourceFilter";
import { formatShortRelativeTime } from "@/lib/format-relative-time";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useMemo, useState } from "react";

const boardStages: PipelineStatus[] = [
  "new",
  "reviewed",
  "outreach",
  "replied",
  "booked",
  "won",
  "lost",
  "not_a_fit",
];

export function CrmPipelineBoard({
  onSelectOpportunity,
}: {
  onSelectOpportunity?: (id: string) => void;
} = {}) {
  const toast = useToast();
  const [items, setItems] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [belowThreshold, setBelowThreshold] = useState(0);
  const [minFitScore, setMinFitScore] = useState(45);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crm/opportunities");
      if (!res.ok) throw new Error("Could not load pipeline");
      const json = (await res.json()) as {
        opportunities: CrmOpportunity[];
        belowThreshold?: number;
        minFitScore?: number;
      };
      setItems(json.opportunities);
      setBelowThreshold(json.belowThreshold ?? 0);
      setMinFitScore(json.minFitScore ?? 45);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const byStage = useMemo(() => {
    const map = new Map<PipelineStatus, CrmOpportunity[]>();
    for (const stage of boardStages) map.set(stage, []);
    for (const opp of items) {
      const list = map.get(opp.stage) ?? [];
      list.push(opp);
      map.set(opp.stage, list);
    }
    return map;
  }, [items]);

  if (loading && items.length === 0) {
    return <p className="text-sm text-muted">Loading pipeline…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-amber-200/90">
        {error}. Run <code className="text-foreground">npm run db:migrate</code> if
        CRM tables are missing.
      </p>
    );
  }

  async function pruneBelowThreshold() {
    setPruning(true);
    try {
      const res = await fetch("/api/admin/crm/prune-below-threshold", {
        method: "POST",
      });
      const json = (await res.json()) as {
        removed?: number;
        minFitScore?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Cleanup failed");
      toast.success(
        `Removed ${json.removed ?? 0} sub-threshold leads (below ${json.minFitScore ?? minFitScore}% fit)`,
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cleanup failed");
    } finally {
      setPruning(false);
    }
  }

  async function backfill() {
    setBackfilling(true);
    try {
      const res = await fetch("/api/admin/crm/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 500 }),
      });
      const json = (await res.json()) as {
        synced?: number;
        failed?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Backfill failed");
      const skipped = (json as { skipped?: number }).skipped;
      toast.success(
        `Synced ${json.synced ?? 0} leads` +
          (skipped ? ` · ${skipped} below min score` : "") +
          (json.failed ? ` · ${json.failed} failed` : ""),
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill failed");
    } finally {
      setBackfilling(false);
    }
  }

  if (items.length === 0 && belowThreshold === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-10 text-center text-sm text-muted">
        <p>
          Leads at or above {minFitScore}% fit appear here after harvest, Huginn, or
          manual capture.
        </p>
        <p className="mt-2">
          Lower-fit leads stay in Growth inbox only.
        </p>
        <AdminActionButton
          className="mt-4"
          busy={backfilling}
          busyLabel="Syncing…"
          onClick={() => void backfill()}
        >
          Sync qualified Growth leads
        </AdminActionButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {belowThreshold > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="text-muted">
            <span className="font-medium text-foreground">{belowThreshold}</span>{" "}
            opportunities are below {minFitScore}% fit (hidden from this board). Remove
            them from CRM?
          </p>
          <AdminActionButton
            busy={pruning}
            busyLabel="Removing…"
            onClick={() => void pruneBelowThreshold()}
          >
            Clean up sub-threshold
          </AdminActionButton>
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          No qualified leads in the pipeline yet. Run harvest or sync qualified Growth
          leads.
        </p>
      ) : (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {boardStages.map((stage) => {
        const cards = byStage.get(stage) ?? [];
        return (
          <div
            key={stage}
            className="flex w-56 min-w-56 max-w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-panel/50"
          >
            <div className="shrink-0 border-b border-line px-3 py-2">
              <p className="truncate text-xs font-semibold text-foreground">
                {crmStageLabels[stage]}
              </p>
              <p className="text-[10px] text-muted">{cards.length}</p>
            </div>
            <ul className="flex min-h-0 max-h-[min(70vh,32rem)] flex-col gap-2 overflow-y-auto overflow-x-hidden p-2">
              {cards.map((opp) => (
                <li key={opp.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectOpportunity?.(opp.id)}
                    className="block w-full min-w-0 overflow-hidden rounded-lg border border-line bg-black/35 p-2.5 text-left transition-colors hover:border-accent/40 hover:bg-black/50"
                  >
                    <p
                      className="line-clamp-3 break-words text-sm font-medium leading-snug text-foreground"
                      title={opp.name}
                    >
                      {opp.name}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-muted">
                      {[
                        formatShortRelativeTime(opp.updatedAt),
                        opp.leadSource
                          ? leadSourceBadgeLabel(opp.leadSource)
                          : null,
                        `${opp.fitScore}% fit`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
      )}
    </div>
  );
}
