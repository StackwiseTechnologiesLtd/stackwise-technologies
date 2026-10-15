"use client";

const presets = [
  { label: "All scores", minScore: 0 },
  { label: "50+ fit", minScore: 50 },
  { label: "60+ fit", minScore: 60 },
  { label: "70+ fit", minScore: 70 },
  { label: "80+ fit", minScore: 80 },
];

export function GrowthScoreFilter({
  minScore,
  onChange,
}: {
  minScore: number;
  onChange: (minScore: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        Min fit
      </span>
      {presets.map((preset) => {
        const active = minScore === preset.minScore;
        return (
          <button
            key={preset.minScore}
            type="button"
            onClick={() => onChange(preset.minScore)}
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

export function scoreBadgeClass(score: number): string {
  if (score >= 75) return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
  if (score >= 55) return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
  return "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30";
}
