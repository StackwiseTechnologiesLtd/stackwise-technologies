"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { GrowthOutreachRun, OutreachTotals } from "@/lib/growth/outreach-types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-black/30 px-4 py-3">
      <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

export function GrowthOutreachPanel() {
  const toast = useToast();
  const [runs, setRuns] = useState<GrowthOutreachRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/growth/outreach/runs");
      if (!res.ok) throw new Error("Could not load outreach runs");
      const json = (await res.json()) as { runs: GrowthOutreachRun[] };
      setRuns(json.runs);
      if (!selectedId && json.runs[0]) setSelectedId(json.runs[0].id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [selectedId, toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const latest = runs[0];
  const totals: OutreachTotals = latest?.totals ?? {
    processed: 0,
    sent: 0,
    no_email: 0,
    failed: 0,
    used_ai: 0,
  };

  async function startRun() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/growth/outreach/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 200, send: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Run failed");
      toast.success(
        `Outreach complete — ${json.run.totals.sent} sent, ${json.run.totals.no_email} drafts (no email)`,
      );
      setSelectedId(json.run.id);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  const exportBase = selectedId
    ? `/api/admin/growth/outreach/runs/${selectedId}?format=`
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Campaign</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Generates a personalized message per harvested lead (profile URL on file), wraps it in
              the Stackwise email template, and sends via SMTP when{" "}
              <code className="text-foreground">growth_leads.email</code> or linked CRM person email
              is set. Leads without an address are saved as{" "}
              <strong className="font-medium text-foreground">draft_ready</strong> in the report.
            </p>
          </div>
          <AdminActionButton busy={running} busyLabel="Running…" onClick={() => void startRun()}>
            Run outreach
          </AdminActionButton>
        </div>

        {latest ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Processed" value={totals.processed} />
            <StatCard label="Sent" value={totals.sent} />
            <StatCard label="No email (draft)" value={totals.no_email} />
            <StatCard label="Failed" value={totals.failed} />
            <StatCard label="AI tailored" value={totals.used_ai} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No runs yet. Start a campaign or run the CLI below.</p>
        )}

        {exportBase ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              className="inline-flex items-center rounded-md border border-line bg-black/40 px-3 py-2 text-sm font-medium text-foreground hover:bg-black/60"
              href={`${exportBase}csv`}
            >
              Download CSV
            </a>
            <a
              className="inline-flex items-center rounded-md border border-line bg-black/40 px-3 py-2 text-sm font-medium text-foreground hover:bg-black/60"
              href={`${exportBase}md`}
            >
              Download Markdown report
            </a>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold tracking-tight">Run history</h3>
          <AdminActionButton busy={loading} busyLabel="Refreshing…" onClick={() => void load()}>
            Refresh
          </AdminActionButton>
        </div>
        <ul className="mt-4 space-y-2">
          {runs.map((run) => (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => setSelectedId(run.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selectedId === run.id
                    ? "border-brand/50 bg-brand/10"
                    : "border-line bg-black/30 hover:bg-black/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{run.id.slice(0, 8)}…</span>
                  <span className="text-xs text-muted">{new Date(run.startedAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-foreground">
                  {run.totals.sent} sent · {run.totals.no_email} no email · {run.totals.processed}{" "}
                  total
                </p>
              </button>
            </li>
          ))}
          {!loading && runs.length === 0 ? (
            <li className="text-sm text-muted">No history.</li>
          ) : null}
        </ul>
        <p className="mt-4 text-xs text-muted">
          CLI (writes <code className="text-foreground">exports/growth-outreach-report-*.md</code>
          ): <code className="text-foreground">npm run growth:outreach</code>
        </p>
      </section>
    </div>
  );
}
