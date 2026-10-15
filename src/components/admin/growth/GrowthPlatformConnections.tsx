"use client";

import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import type { PlatformCredentialStatus, SessionStatus } from "@/lib/growth/types";
import { ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import { useCallback, useEffect, useState } from "react";

const statusLabel: Record<SessionStatus, string> = {
  active: "Connected",
  expired: "Session expired",
  challenge: "Login or verification needed",
  unknown: "Not verified yet",
  disconnected: "Not connected",
};

const statusClass: Record<SessionStatus, string> = {
  active: "text-emerald-400",
  expired: "text-amber-400",
  challenge: "text-amber-400",
  unknown: "text-muted",
  disconnected: "text-muted",
};

export function GrowthPlatformConnections() {
  const toast = useToast();
  const [platforms, setPlatforms] = useState<PlatformCredentialStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/growth/sessions");
      if (!res.ok) throw new Error("Could not load sessions");
      const json = (await res.json()) as { platforms: PlatformCredentialStatus[] };
      setPlatforms(json.platforms);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted">Checking platform sessions…</p>;
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Platform login</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            LinkedIn and X sessions are captured in a real browser on your machine, then
            stored encrypted on Stackwise. Cloudflare hosts the app and inbox only;
            Playwright runs locally or on a small worker VM, not on Workers.
          </p>
        </div>
        <button type="button" className={ADMIN_BTN_SECONDARY} onClick={() => void load()}>
          Refresh status
        </button>
      </div>

      <ul className="mt-6 space-y-4">
        {platforms.map((p) => (
          <li
            key={p.platform}
            className="flex flex-col gap-2 rounded-lg border border-white/8 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium capitalize">{p.platform}</p>
              <p className={`text-sm ${statusClass[p.sessionStatus]}`}>
                {statusLabel[p.sessionStatus]}
                {p.connectedAccountLabel ? ` · ${p.connectedAccountLabel}` : ""}
              </p>
              {p.lastHealthCheckAt ? (
                <p className="text-xs text-muted">
                  Last check: {new Date(p.lastHealthCheckAt).toLocaleString()}
                </p>
              ) : null}
              {p.lastError ? (
                <p className="mt-1 text-xs text-amber-200/90">{p.lastError}</p>
              ) : null}
            </div>
            <Link
              href={`/admin/growth/connect?platform=${p.platform}`}
              className={ADMIN_BTN_SECONDARY}
            >
              {p.sessionStatus === "active" ? "Reconnect" : "Connect"}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
