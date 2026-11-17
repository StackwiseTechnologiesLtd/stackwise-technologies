"use client";

import {
  crmSavedViews,
  type CrmSavedViewId,
} from "@/lib/crm/saved-views";

export function CrmSavedViewTabs({
  value,
  onChange,
}: {
  value: CrmSavedViewId;
  onChange: (view: CrmSavedViewId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Saved views">
      {crmSavedViews.map((view) => {
        const active = value === view.id;
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={view.description}
            onClick={() => onChange(view.id)}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-accent/40 bg-accent/15 text-foreground"
                : "border-[var(--admin-border)] text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
            }`}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}