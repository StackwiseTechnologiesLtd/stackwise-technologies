"use client";

import { INBOX_DEFAULT_FRESHNESS_HOURS } from "@/lib/growth/harvest-config";

const presets = [
  { label: "Last 24h", hours: 24 },
  { label: "Last 72h", hours: INBOX_DEFAULT_FRESHNESS_HOURS },
  { label: "Last 7 days", hours: 24 * 7 },
  { label: "All time", hours: 0 },
];

export function GrowthFreshnessFilter({
  freshnessHours,
  onChange,
}: {
  freshnessHours: number;
  onChange: (hours: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        When
      </span>
      {presets.map((preset) => {
        const active = freshnessHours === preset.hours;
        return (
          <button
            key={preset.hours}
            type="button"
            onClick={() => onChange(preset.hours)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                : "bg-black/40 text-muted ring-1 ring-line hover:text-foreground"
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
