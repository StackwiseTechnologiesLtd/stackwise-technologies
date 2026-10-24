"use client";

import { leadSourceBadgeLabel } from "@/components/admin/growth/GrowthLeadSourceFilter";
import { scoreBadgeClass } from "@/components/admin/growth/GrowthScoreFilter";
import { crmStageLabels, type CrmOpportunity } from "@/lib/crm/types";
import { formatShortRelativeTime } from "@/lib/format-relative-time";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useState } from "react";

export function CrmRecordTable() {
  const [items, setItems] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crm/opportunities");
      if (!res.ok) throw new Error("Could not load opportunities");
      const json = (await res.json()) as { opportunities: CrmOpportunity[] };
      setItems(json.opportunities);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  if (loading && items.length === 0) {
    return <p className="text-sm text-muted">Loading list…</p>;
  }

  if (error) {
    return <p className="text-sm text-amber-200/90">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        No qualified opportunities. Use the board view or sync from Growth.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel/50">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Fit</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((opp) => (
            <tr
              key={opp.id}
              className="border-b border-line/60 last:border-0 hover:bg-black/20"
            >
              <td className="max-w-[16rem] px-4 py-3">
                <Link
                  href={`/admin/crm/opportunities/${opp.id}`}
                  className="line-clamp-2 break-words font-medium text-accent hover:underline"
                  title={opp.name}
                >
                  {opp.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {crmStageLabels[opp.stage]}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ring-1 ${scoreBadgeClass(opp.fitScore)}`}
                >
                  {opp.fitScore}%
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {opp.leadSource ? leadSourceBadgeLabel(opp.leadSource) : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">
                {formatShortRelativeTime(opp.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
