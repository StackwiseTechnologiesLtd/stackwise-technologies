"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { growthHubLinks } from "@/lib/admin/nav-meta";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

type OutreachRunsResponse = {
  runs: {
    id: string;
    startedAt: string;
    totals: { processed: number; sent: number; no_email: number };
  }[];
};

const flowSteps = [
  {
    step: "1",
    title: "Connect & harvest",
    body: "Link LinkedIn / X, run ICP harvest, ingest jobs, or scrape the web locally (Firecrawl).",
    href: "/admin/growth/discover",
  },
  {
    step: "2",
    title: "Triage inbox",
    body: "Review fit scores, generate replies, copy to social posts.",
    href: "/admin/growth/inbox",
  },
  {
    step: "3",
    title: "Pipeline & email",
    body: "Promote to CRM, run tailored outreach when you have emails.",
    href: "/admin/growth/outreach",
  },
];

export default function GrowthDashboardPage() {
  const [latestOutreach, setLatestOutreach] = useState<OutreachRunsResponse["runs"][0] | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/growth/outreach/runs");
      if (!res.ok) return;
      const json = (await res.json()) as OutreachRunsResponse;
      setLatestOutreach(json.runs[0] ?? null);
    } catch {
      /* optional */
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Growth dashboard"
        description="Discover leads, reply on social, track jobs, and run email outreach — then move wins through CRM."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        {flowSteps.map((item) => (
          <Link
            key={item.step}
            href={item.href}
            className="group rounded-xl border border-line bg-panel p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Step {item.step}
            </span>
            <h2 className="mt-2 text-base font-semibold text-foreground group-hover:text-accent">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{item.body}</p>
          </Link>
        ))}
      </section>

      {latestOutreach ? (
        <section className="rounded-xl border border-line bg-panel px-4 py-3 text-sm">
          <span className="text-muted">Latest email outreach: </span>
          <span className="font-medium text-foreground">
            {latestOutreach.totals.sent} sent · {latestOutreach.totals.no_email} drafts (no email) ·{" "}
            {latestOutreach.totals.processed} processed
          </span>
          <Link href="/admin/growth/outreach" className="ml-2 font-medium text-accent hover:underline">
            View report →
          </Link>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">All areas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {growthHubLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-line bg-black/20 px-4 py-3 text-sm transition-colors hover:border-accent/35 hover:bg-black/30"
            >
              <span className="font-medium text-foreground">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
