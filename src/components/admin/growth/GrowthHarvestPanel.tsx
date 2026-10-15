"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type { HarvestProgressEvent } from "@/lib/growth/harvest-progress";
import type { GrowthPlatform, PlatformCredentialStatus } from "@/lib/growth/types";
import {
  platformAccountDisplay,
  platformDisplayName,
} from "@/lib/growth/detect-account-label";
import { growthFetch } from "@/lib/growth/growth-fetch";
import { useCallback, useEffect, useState } from "react";

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

export function GrowthHarvestPanel({ onHarvested }: { onHarvested?: () => void }) {
  const toast = useToast();
  const [platforms, setPlatforms] = useState<PlatformCredentialStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState<GrowthPlatform | null>(null);
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [activity, setActivity] = useState<HarvestProgressEvent[]>([]);
  const [harvestError, setHarvestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, leadsRes] = await Promise.all([
        growthFetch("/api/admin/growth/sessions"),
        growthFetch("/api/admin/growth/leads"),
      ]);
      if (sessionsRes.ok) {
        const json = (await sessionsRes.json()) as {
          platforms: PlatformCredentialStatus[];
        };
        setPlatforms(json.platforms);
      }
      if (leadsRes.ok) {
        const json = (await leadsRes.json()) as { leads: unknown[] };
        setLeadCount(json.leads.length);
      }
    } catch {
      toast.error("Could not load growth status");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function harvest(platform: GrowthPlatform) {
    setHarvesting(platform);
    setHarvestError(null);
    setActivity([
      progressEvent("session", `Starting ${platform === "x" ? "X" : "LinkedIn"} harvest…`),
    ]);

    try {
      const res = await fetch("/api/admin/growth/harvest?stream=1", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({ platform }),
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
      if (ingested === 0 && !harvestError) {
        toast.toast(
          captured > 0
            ? `Scanned ${captured} posts but none became leads.`
            : `No posts found on feed.`,
        );
      } else if (ingested > 0) {
        toast.success(
          `Added ${ingested} lead${ingested === 1 ? "" : "s"} with reply drafts`,
        );
      }
      await load();
      onHarvested?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Harvest failed";
      if (!harvestError) setHarvestError(message);
      toast.error(message);
    } finally {
      setHarvesting(null);
    }
  }

  function progressEvent(phase: string, message: string): HarvestProgressEvent {
    return {
      type: "progress",
      phase,
      message,
      at: new Date().toISOString(),
    };
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        Loading lead generation…
      </p>
    );
  }

  const connected = platforms.filter((p) => p.sessionStatus === "active");

  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Lead generation</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Runs keyword searches from your ICP settings (intent phrases), scores
            matching posts, and creates reply drafts in the inbox below.
          </p>
          {leadCount !== null ? (
            <p className="mt-2 text-sm text-foreground">
              <span className="font-mono text-accent">{leadCount}</span> lead
              {leadCount === 1 ? "" : "s"} in pipeline
            </p>
          ) : null}
        </div>
        <AdminActionButton busy={loading} busyLabel="Refreshing…" onClick={() => void load()}>
          Refresh
        </AdminActionButton>
      </div>

      {connected.length === 0 ? (
        <p className="mt-4 text-sm text-amber-200/90">
          Connect LinkedIn or X in Settings before harvesting.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {connected.map((p) => {
            const account = platformAccountDisplay(p);
            return (
              <li key={p.platform} className="flex flex-col gap-1">
                <AdminActionButton
                  variant="primary"
                  busy={harvesting === p.platform}
                  busyLabel="Harvesting…"
                  disabled={harvesting !== null && harvesting !== p.platform}
                  onClick={() => void harvest(p.platform)}
                >
                  Harvest {platformDisplayName(p.platform)}
                  {account ? ` (${account})` : ""}
                </AdminActionButton>
                {account ? (
                  <span className="text-center text-[10px] text-muted">
                    Using {platformDisplayName(p.platform)} account {account}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {activity.length > 0 ? (
        <div
          className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3"
          aria-live="polite"
          aria-busy={harvesting !== null}
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Harvest activity
            {harvesting ? (
              <span className="ml-2 inline-flex items-center gap-1.5 normal-case text-foreground">
                <span className="size-2 animate-pulse rounded-full bg-accent" />
                In progress
              </span>
            ) : harvestError ? (
              <span className="ml-2 normal-case text-amber-300">Failed</span>
            ) : (
              <span className="ml-2 normal-case text-emerald-400">Finished</span>
            )}
          </p>
          <ol className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
            {activity.map((line, i) => {
              const isLast = i === activity.length - 1;
              const isError = line.type === "error";
              const isComplete = line.type === "complete";
              const text =
                line.type === "progress"
                  ? line.message
                  : line.type === "error"
                    ? line.message
                    : line.type === "complete"
                      ? `Finished — ${line.ingested} lead${line.ingested === 1 ? "" : "s"} created from ${line.captured} post${line.captured === 1 ? "" : "s"}.`
                      : "";
              return (
                <li
                  key={`${line.at}-${i}`}
                  className={`flex gap-2 ${
                    isError
                      ? "text-amber-200"
                      : isComplete
                        ? "text-emerald-400"
                        : isLast && harvesting
                          ? "text-foreground"
                          : "text-muted"
                  }`}
                >
                  <span className="shrink-0 font-mono text-[11px] opacity-70">
                    {formatLogTime(line.at)}
                  </span>
                  <span>{text}</span>
                </li>
              );
            })}
          </ol>
          {harvestError ? (
            <p className="mt-3 border-t border-white/10 pt-2 text-sm text-amber-200">
              {harvestError}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-muted">
        Read-only scan with human-like pacing. Watch the activity log while it runs.
      </p>
    </section>
  );
}
