"use client";

import { CrmOpportunityDetailPanel } from "@/components/admin/crm/CrmOpportunityDetail";
import { useEffect } from "react";

export function CrmOpportunityModal({
  opportunityId,
  onClose,
  onUpdated,
}: {
  opportunityId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  useEffect(() => {
    if (!opportunityId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opportunityId, onClose]);

  useEffect(() => {
    if (!opportunityId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [opportunityId]);

  if (!opportunityId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close opportunity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-opportunity-title"
        className="relative flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl sm:rounded-2xl"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3 sm:px-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Opportunity
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:bg-black/30 hover:text-foreground"
          >
            Close
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <CrmOpportunityDetailPanel
            opportunityId={opportunityId}
            variant="modal"
            onStageChange={onUpdated}
          />
        </div>
      </div>
    </div>
  );
}
