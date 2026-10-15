"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type { GrowthPlatform, PlatformCredentialStatus, SessionStatus } from "@/lib/growth/types";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [platforms, setPlatforms] = useState<PlatformCredentialStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState<GrowthPlatform | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/admin/growth/sessions");
      if (!res.ok) throw new Error("Could not load sessions");
      const json = (await res.json()) as { platforms: PlatformCredentialStatus[] };
      setPlatforms(json.platforms);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openConnect(platform: GrowthPlatform) {
    setConnecting(platform);
    router.push(`/admin/growth/connect?platform=${platform}`);
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        Checking platform sessions…
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Platform login</h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Click Connect to sign in inside the admin panel. Run{" "}
            <code className="text-foreground">npm run growth:connect-server</code> once on
            this machine first.
          </p>
        </div>
        <AdminActionButton
          busy={refreshing}
          busyLabel="Refreshing…"
          onClick={() => void load({ silent: true })}
        >
          Refresh status
        </AdminActionButton>
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
            <AdminActionButton
              busy={connecting === p.platform}
              busyLabel="Opening…"
              onClick={() => openConnect(p.platform)}
            >
              {p.sessionStatus === "active" ? "Reconnect" : "Connect"}
            </AdminActionButton>
          </li>
        ))}
      </ul>
    </section>
  );
}
