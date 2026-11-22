"use client";

import Link from "next/link";

export function GrowthXHiringPanel() {
  return (
    <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">X.com job search</h2>
          <p className="mt-1 max-w-xl text-xs text-muted">
            Harvest hiring tweets with your connected X session, promote dev-fit posts to
            CRM, post public apply replies, and log everything for the dashboard. LinkedIn
            uses the panels below — same application log when we wire it next.
          </p>
        </div>
        <Link
          href="/admin/crm?view=x_hiring"
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          CRM → X hiring
        </Link>
      </div>
      <ol className="mt-4 space-y-2 text-xs text-muted">
        <li>
          <span className="font-medium text-foreground">1.</span> Connect X under{" "}
          <Link href="/admin/growth/settings" className="text-accent hover:underline">
            Growth → Settings
          </Link>
          .
        </li>
        <li>
          <span className="font-medium text-foreground">2.</span> Monitor X (harvest + CRM, no
          replies):{" "}
          <code className="rounded bg-[var(--admin-canvas)] px-1.5 py-0.5 text-[11px] text-foreground">
            npm run growth:x-hiring:watch
          </code>{" "}
          — or full run:{" "}
          <code className="rounded bg-[var(--admin-canvas)] px-1.5 py-0.5 text-[11px] text-foreground">
            npm run growth:x-hiring:run
          </code>
        </li>
        <li>
          <span className="font-medium text-foreground">2b.</span> Tidy pipeline noise:{" "}
          <code className="rounded bg-[var(--admin-canvas)] px-1.5 py-0.5 text-[11px] text-foreground">
            npm run growth:pipeline:cleanup
          </code>{" "}
          then{" "}
          <code className="rounded bg-[var(--admin-canvas)] px-1.5 py-0.5 text-[11px] text-foreground">
            PIPELINE_CLEANUP_APPLY=1 npm run growth:pipeline:cleanup
          </code>
        </li>
        <li>
          <span className="font-medium text-foreground">3.</span> Finish ATS forms with{" "}
          <code className="rounded bg-[var(--admin-canvas)] px-1.5 py-0.5 text-[11px] text-foreground">
            npm run growth:x-hiring:run -- --ats
          </code>{" "}
          (resume upload still manual).
        </li>
      </ol>
      <p className="mt-3 text-[11px] text-muted">
        Flags: <code className="text-foreground">--dry</code>,{" "}
        <code className="text-foreground">--skip-harvest</code>,{" "}
        <code className="text-foreground">--skip-apply</code>
      </p>
    </section>
  );
}