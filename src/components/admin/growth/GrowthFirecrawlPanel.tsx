"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

type DiscoverResult = {
  query: string;
  pagesScanned: number;
  emailsFound: number;
  leadsCreated: number;
  leadsSkipped: number;
  errors: string[];
};

export function GrowthFirecrawlPanel() {
  const toast = useToast();
  const [query, setQuery] = useState("founder hiring full stack developer remote");
  const [limit, setLimit] = useState(10);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiscoverResult | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/growth/firecrawl/discover");
      if (!res.ok) throw new Error("status");
      const json = (await res.json()) as { ok: boolean };
      setApiOk(json.ok);
    } catch {
      setApiOk(false);
    }
  }, []);

  useDeferredEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const [redditRunning, setRedditRunning] = useState(false);
  const [redditResult, setRedditResult] = useState<{
    totals: {
      pagesScanned: number;
      emailsFound: number;
      leadsCreated: number;
      leadsSkipped: number;
    };
  } | null>(null);

  async function runRedditDiscover() {
    setRedditRunning(true);
    setRedditResult(null);
    try {
      const res = await fetch("/api/admin/growth/firecrawl/reddit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limitPerQuery: limit }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Reddit discover failed");
      setRedditResult(json);
      toast.success(
        `Reddit: ${json.totals.leadsCreated} leads with validated emails (no emails sent)`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reddit discover failed");
    } finally {
      setRedditRunning(false);
    }
  }

  async function runDiscover() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/growth/firecrawl/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Discover failed");
      setResult(json as DiscoverResult);
      toast.success(`Added ${json.leadsCreated} leads with validated emails (not sent)`);
      await checkHealth();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Discover failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Web discover"
        description="Search and scrape via self-hosted Firecrawl. Saves validated emails only — use Email outreach later when you are ready (set GROWTH_OUTREACH_SEND=0 to block sends)."
      />

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <p className="text-sm text-muted">
          Local API:{" "}
          <code className="text-foreground">http://localhost:3002</code>
          {" · "}
          {apiOk === null ? "Checking…" : apiOk ? "Connected" : "Down — run npm run integrations:firecrawl:up"}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            <span className="text-muted">Search query</span>
            <input
              className="rounded-md border border-line bg-black/30 px-3 py-2 text-foreground"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="flex w-full flex-col gap-1 text-sm sm:w-24">
            <span className="text-muted">Pages</span>
            <input
              type="number"
              min={1}
              max={20}
              className="rounded-md border border-line bg-black/30 px-3 py-2 text-foreground"
              value={limit}
              onChange={(e) => setLimit(Number.parseInt(e.target.value, 10) || 10)}
            />
          </label>
          <AdminActionButton busy={running} busyLabel="Searching…" onClick={() => void runDiscover()}>
            Discover leads
          </AdminActionButton>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-foreground">Reddit (via Firecrawl)</h3>
          <p className="mt-1 text-sm text-muted">
            Runs several <code className="text-foreground">site:reddit.com</code> searches for dev, UI/UX,
            and loyalty intent. Stores MX-valid emails only — does not send mail.
          </p>
          <div className="mt-3">
            <AdminActionButton
              busy={redditRunning}
              busyLabel="Crawling Reddit…"
              onClick={() => void runRedditDiscover()}
            >
              Discover Reddit leads
            </AdminActionButton>
          </div>
          {redditResult ? (
            <ul className="mt-3 list-inside list-disc text-sm text-muted">
              <li>{redditResult.totals.pagesScanned} Reddit pages scanned</li>
              <li>{redditResult.totals.emailsFound} emails found</li>
              <li>{redditResult.totals.leadsCreated} leads saved</li>
            </ul>
          ) : null}
        </div>

        {result ? (
          <div className="mt-6 rounded-lg border border-line bg-black/25 p-4 text-sm">
            <p className="font-medium text-foreground">Last run: {result.query}</p>
            <ul className="mt-2 list-inside list-disc text-muted">
              <li>{result.pagesScanned} pages scanned</li>
              <li>{result.emailsFound} emails found</li>
              <li>{result.leadsCreated} leads created</li>
              <li>{result.leadsSkipped} skipped (dupes / errors)</li>
            </ul>
            {result.errors.length > 0 ? (
              <pre className="mt-3 max-h-40 overflow-auto text-xs text-amber-200/90">
                {result.errors.slice(0, 8).join("\n")}
              </pre>
            ) : null}
            <p className="mt-4 text-muted">
              Review leads in Growth inbox. Outreach is separate — keep{" "}
              <code className="text-foreground">GROWTH_OUTREACH_SEND=0</code> until you are ready to send.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
