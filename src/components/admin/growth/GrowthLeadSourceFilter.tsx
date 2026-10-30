"use client";

import { leadSources, type LeadSource } from "@/lib/growth/types";

export type LeadSourceFilter = "all" | LeadSource;

const labels: Record<LeadSource, string> = {
  harvest: "Harvest",
  huginn: "Huginn",
  freehire: "Jobs",
  manual: "Manual",
};

const options: { id: LeadSourceFilter; label: string }[] = [
  { id: "all", label: "All channels" },
  ...leadSources.map((id) => ({ id, label: labels[id] })),
];

export function GrowthLeadSourceFilter({
  value,
  onChange,
}: {
  value: LeadSourceFilter;
  onChange: (value: LeadSourceFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        Channel
      </span>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                : "bg-black/40 text-muted ring-1 ring-line hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function leadSourceBadgeLabel(source: LeadSource): string {
  return labels[source];
}
