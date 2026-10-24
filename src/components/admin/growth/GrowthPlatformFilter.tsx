"use client";

import type { GrowthPlatform } from "@/lib/growth/types";

export type PlatformFilter = "all" | GrowthPlatform;

const options: { id: PlatformFilter; label: string }[] = [
  { id: "all", label: "All sources" },
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
];

export function GrowthPlatformFilter({
  value,
  onChange,
}: {
  value: PlatformFilter;
  onChange: (value: PlatformFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        Platform
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
