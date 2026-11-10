"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type { HarvestProgressEvent } from "@/lib/growth/harvest-progress";
import type { PlatformCredentialStatus } from "@/lib/growth/types";
import { platformAccountDisplay } from "@/lib/growth/detect-account-label";
import { growthFetch } from "@/lib/growth/growth-fetch";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export function GrowthLinkedInJobsHarvestPanel({
  onHarvested,
}: {
  onHarvested?: () => void;
}) {
  const toast = useToast();
  const [linkedin, setLinkedin] = useState<PlatformCredentialStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [activity, setActivity] = useState<HarvestProgressEvent[]>([]);
  const [harvestError, setHarvestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await growthFetch("/api/admin/growth/sessions");
      if (res.ok) {
        const json = (await res.json()) as {
          platforms: PlatformCredentialStatus[];
        };
        setLinkedin(
          json.platforms.find((p) => p.platform === "linkedin") ?? null,
        );
      }
    } catch {
      toast.error("Could not load LinkedIn session");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function harvest() {
    setHarvesting(true);
    setHarvestError(null);
    setActivity([
      {
        type: "progress",
        phase: "session",
        message: "Starting LinkedIn Jobs harvest (remote)…",
        at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/admin/growth/harvest-jobs?stream=1", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: "{}",
      });

      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? `Harvest failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let complete: { captured: number; ingested: number } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as HarvestProgressEvent;
          setActivity((prev) => [...prev, ev]);
          if (ev.type === "error") {
            setHarvestError(ev.message);
            throw new Error(ev.message);
          }
          if (ev.type === "complete") {
            complete = { captured: ev.captured, ingested: ev.ingested };
          }
        }
      }

      const ingested = complete?.ingested ?? 0;
      const captured = complete?.captured ?? 0;
      if (ingested === 0) {
        toast.toast(
          captured > 0
            ? `Scanned ${captured} jobs but none became leads.`
            : "No LinkedIn job cards found — check session or ICP titles.",
        );
      } else {
        toast.success(
          `Added ${ingested} job lead${ingested === 1 ? "" : "s"} from LinkedIn`,
        );
      }
      onHarvested?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Harvest failed";
      if (!harvestError) setHarvestError(message);
      toast.error(message);
    } finally {
      setHarvesting(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        Loading LinkedIn Jobs harvest…
      </p>
    );
  }

  const connected = linkedin?.sessionStatus === "active";
  const account = linkedin ? platformAccountDisplay(linkedin) : null;

  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            LinkedIn Jobs harvest
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Uses your Connect session to search <strong>remote</strong> LinkedIn
            Jobs from ICP title keywords, then scores listings into this inbox.
            Apply stays human-assisted (draft note + open posting).
          </p>
        </div>
        <AdminActionButton
          variant="primary"
          busy={harvesting}
          busyLabel="Harvesting…"
          disabled={!connected || harvesting}
          onClick={() => void harvest()}
        >
          Harvest LinkedIn jobs
          {account ? ` (${account})` : ""}
        </AdminActionButton>
      </div>

      {!connected ? (
        <p className="mt-4 text-sm text-amber-200/90">
          Connect LinkedIn in Growth → Connect before harvesting jobs.
        </p>
      ) : null}

      {harvestError ? (
        <p className="mt-3 text-sm text-amber-200/90">{harvestError}</p>
      ) : null}

      {activity.length > 0 ? (
        <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto rounded-lg bg-black/30 p-3 text-xs text-muted ring-1 ring-line">
          {activity.map((ev, i) => (
            <li key={`${ev.at}-${i}`}>
              <span className="tabular-nums text-muted/70">
                {formatLogTime(ev.at)}
              </span>{" "}
              {ev.type === "progress"
                ? ev.message
                : ev.type === "complete"
                  ? `Done — ${ev.ingested} ingested / ${ev.captured} captured`
                  : ev.type === "error"
                    ? ev.message
                    : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
