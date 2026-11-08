"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type {
  GrowthOutreachItem,
  GrowthOutreachRun,
  OutreachResponseStatus,
  OutreachTotals,
} from "@/lib/growth/outreach-types";
import { outreachResponseStatuses } from "@/lib/growth/outreach-types";
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
  const [runItems, setRunItems] = useState<GrowthOutreachItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

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

  const loadRunItems = useCallback(
    async (runId: string | null) => {
      if (!runId) {
        setRunItems([]);
        return;
      }
      setItemsLoading(true);
      try {
        const res = await fetch(`/api/admin/growth/outreach/runs/${runId}`);
        if (!res.ok) throw new Error("Could not load run items");
        const json = (await res.json()) as { items: GrowthOutreachItem[] };
        setRunItems(json.items ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Load items failed");
        setRunItems([]);
      } finally {
        setItemsLoading(false);
      }
    },
    [toast],
  );

  useDeferredEffect(() => {
    void loadRunItems(selectedId);
  }, [selectedId, loadRunItems]);

  async function markResponse(
    itemId: string,
    responseStatus: OutreachResponseStatus,
  ) {
    try {
      const res = await fetch(`/api/admin/growth/outreach/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setRunItems((prev) =>
        prev.map((item) => (item.id === itemId ? (json.item as GrowthOutreachItem) : item)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  const latest = runs[0];
  const totals: OutreachTotals = latest?.totals ?? {
    processed: 0,
    sent: 0,
    no_email: 0,
    invalid_email: 0,
    failed: 0,
    used_ai: 0,
  };

  async function startRun() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/growth/outreach/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 200, send: true, leadSource: "firecrawl" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Run failed");
      toast.success(
        `Outreach complete — ${json.run.totals.sent} sent, ${json.run.totals.invalid_email ?? 0} invalid, ${json.run.totals.no_email} no email`,
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
              Generates a personalized message per lead, wraps it in the Stackwise email template, and
              sends via SMTP when an email is on file. Each address is syntax-checked and verified for a
              domain MX record before send; invalid addresses are logged, not sent. Sent messages are
              listed below so you can mark reply status later. Set{" "}
              <code className="text-foreground">GROWTH_OUTREACH_SEND=0</code> in{" "}
              <code className="text-foreground">.env.local</code> to draft only (no SMTP).{" "}
              <strong className="font-medium text-foreground">firecrawl</strong> leads (and{" "}
              <code className="text-foreground">GROWTH_OUTREACH_SKIP_SCORE=1</code>) skip the minimum
              fit score for AI tailoring.
            </p>
          </div>
          <AdminActionButton busy={running} busyLabel="Running…" onClick={() => void startRun()}>
            Run outreach
          </AdminActionButton>
        </div>

        {latest ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard label="Processed" value={totals.processed} />
            <StatCard label="Sent" value={totals.sent} />
            <StatCard label="Invalid email" value={totals.invalid_email ?? 0} />
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

      {selectedId ? (
        <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
          <h3 className="text-base font-semibold tracking-tight">Sent &amp; tracked</h3>
          <p className="mt-1 text-sm text-muted">
            Mark whether each recipient replied after a campaign run. Validation failures show as invalid
            email in run totals, not here.
          </p>
          {itemsLoading ? (
            <p className="mt-4 text-sm text-muted">Loading items…</p>
          ) : (
            <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
              {runItems
                .filter((item) => item.status === "sent" || item.recipientEmail)
                .map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-line bg-black/30 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {item.recipientName ?? item.companyName ?? "Lead"}
                        </p>
                        <p className="text-xs text-muted">
                          {item.recipientEmail ?? "—"} · {item.status}
                          {item.sentAt ? ` · ${new Date(item.sentAt).toLocaleString()}` : ""}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted">{item.subjectLine}</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <span className="text-muted">Reply</span>
                        <select
                          className="rounded-md border border-line bg-background px-2 py-1 text-foreground"
                          value={item.responseStatus}
                          onChange={(e) =>
                            void markResponse(
                              item.id,
                              e.target.value as OutreachResponseStatus,
                            )
                          }
                        >
                          {outreachResponseStatuses.map((s) => (
                            <option key={s} value={s}>
                              {s.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </li>
                ))}
              {!itemsLoading && runItems.length === 0 ? (
                <li className="text-sm text-muted">No items in this run.</li>
              ) : null}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
