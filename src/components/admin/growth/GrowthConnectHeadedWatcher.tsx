"use client";

import { useEffect } from "react";

type Props = {
  sessionId: string;
  viewerBase: string;
  label: string;
  onComplete: () => void;
  onError: (message: string) => void;
};

export function GrowthConnectHeadedWatcher({
  sessionId,
  viewerBase,
  label,
  onComplete,
  onError,
}: Props) {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(`${viewerBase}/v1/status/${sessionId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          timer = setTimeout(poll, 1500);
          return;
        }
        const st = (await res.json()) as {
          status: string;
          lastError?: string | null;
        };
        if (st.status === "complete") {
          onComplete();
          return;
        }
        if (st.status === "error") {
          onError(st.lastError ?? "Connection failed");
          return;
        }
      } catch {
        /* retry */
      }
      timer = setTimeout(poll, 1200);
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, viewerBase, onComplete, onError]);

  return (
    <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-5">
      <p className="text-sm font-medium text-foreground">
        Chromium opened on your Mac — sign in to {label} in that window
      </p>
      <p className="text-sm text-muted">
        Use the real browser window (not this page). When login succeeds, this screen
        updates automatically. Leave this tab open until you see connected.
      </p>
      <p className="text-xs text-muted">
        If no window appeared, check the Dock for Chromium, or allow pop-ups for this
        site and try again.
      </p>
    </div>
  );
}
