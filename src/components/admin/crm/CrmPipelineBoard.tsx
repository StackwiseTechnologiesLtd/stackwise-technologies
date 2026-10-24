"use client";

import { crmStageLabels } from "@/lib/crm/types";
import type { CrmOpportunity } from "@/lib/crm/types";
import type { PipelineStatus } from "@/lib/growth/types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
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

export function CrmPipelineBoard() {
  const [items, setItems] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crm/opportunities");
      if (!res.ok) throw new Error("Could not load pipeline");
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

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-panel/40 p-10 text-center text-sm text-muted">
        No opportunities yet. Use <strong className="text-foreground">Promote to CRM</strong>{" "}
        from Growth inbox or leads.
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {boardStages.map((stage) => {
        const cards = byStage.get(stage) ?? [];
        return (
          <div
            key={stage}
            className="flex w-56 shrink-0 flex-col rounded-xl border border-line bg-panel/50"
          >
            <div className="border-b border-line px-3 py-2">
              <p className="text-xs font-semibold text-foreground">
                {crmStageLabels[stage]}
              </p>
              <p className="text-[10px] text-muted">{cards.length}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 p-2">
              {cards.map((opp) => (
                <li key={opp.id}>
                  <Link
                    href={`/admin/crm/opportunities/${opp.id}`}
                    className="block rounded-lg border border-line bg-black/35 p-2.5 text-left transition-colors hover:border-accent/40 hover:bg-black/50"
                  >
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {opp.name}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {opp.fitScore}% fit
                      {opp.platform ? ` · ${opp.platform}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
