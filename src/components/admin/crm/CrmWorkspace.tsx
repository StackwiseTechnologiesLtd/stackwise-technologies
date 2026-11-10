"use client";

import { CrmOpportunityModal } from "@/components/admin/crm/CrmOpportunityModal";
import { CrmPipelineBoard } from "@/components/admin/crm/CrmPipelineBoard";
import { CrmRecordTable } from "@/components/admin/crm/CrmRecordTable";
import { useCallback, useState } from "react";

type CrmView = "board" | "table";

export function CrmWorkspace({
  initialOpportunityId = null,
}: {
  initialOpportunityId?: string | null;
}) {
  const [view, setView] = useState<CrmView>("board");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialOpportunityId,
  );
  const [listVersion, setListVersion] = useState(0);

  const bumpList = useCallback(() => {
    setListVersion((v) => v + 1);
  }, []);

  return (
    <div className="space-y-4">
      <div
        className="inline-flex rounded-lg border border-line bg-black/30 p-0.5"
        role="tablist"
        aria-label="CRM view"
      >
        {(
          [
            { id: "board" as const, label: "Board" },
            { id: "table" as const, label: "Table" },
          ] as const
        ).map((tab) => {
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {view === "board" ? (
        <CrmPipelineBoard
          key={`board-${listVersion}`}
          onSelectOpportunity={setSelectedId}
        />
      ) : (
        <CrmRecordTable
          key={`table-${listVersion}`}
          onSelectOpportunity={setSelectedId}
        />
      )}

      <CrmOpportunityModal
        opportunityId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={bumpList}
      />
    </div>
  );
}
