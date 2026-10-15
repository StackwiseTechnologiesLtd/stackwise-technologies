"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useToast } from "@/components/ToastProvider";
import type { ConnectMode, GrowthPlatform } from "@/lib/growth/types";
import { ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Phase =
  | "idle"
  | "checking_helper"
  | "helper_offline"
  | "starting"
  | "streaming"
  | "complete"
  | "error";

export function GrowthConnectPanel({ platform }: { platform: GrowthPlatform }) {
  const toast = useToast();
  const label = platform === "x" ? "X" : "LinkedIn";
  const [phase, setPhase] = useState<Phase>("idle");
  const [viewerBase, setViewerBase] = useState("http://127.0.0.1:9234");
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [connectMode, setConnectMode] = useState<ConnectMode>("local");

  const checkHelper = useCallback(async (base: string) => {
    try {
      const res = await fetch(`${base}/health`, {
        method: "GET",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/growth/connect/config");
        if (!res.ok) return;
        const json = (await res.json()) as {
          mode: ConnectMode;
          viewerBaseUrl: string;
        };
        setConnectMode(json.mode);
        setViewerBase(json.viewerBaseUrl.replace(/\/$/, ""));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const pollSessionActive = useCallback(async () => {
    const res = await fetch("/api/admin/growth/sessions");
    if (!res.ok) return false;
    const json = (await res.json()) as {
      platforms: { platform: GrowthPlatform; sessionStatus: string }[];
    };
    const row = json.platforms.find((p) => p.platform === platform);
    return row?.sessionStatus === "active";
  }, [platform]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "growth-connect-complete") {
        setPhase("complete");
        toast.success(`${label} session saved`);
        void pollSessionActive();
      }
      if (event.data?.type === "growth-connect-error") {
        setErrorMessage(
          typeof event.data.message === "string"
            ? event.data.message
            : "Connection failed",
        );
        setPhase("error");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [label, pollSessionActive, toast]);

  async function beginConnect() {
    setErrorMessage(null);
    setLaunching(true);
    setPhase("checking_helper");
    try {
      const handshakeRes = await fetch("/api/admin/growth/connect/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (!handshakeRes.ok) {
        throw new Error("Could not start connect session");
      }
      const handshake = (await handshakeRes.json()) as {
        token: string;
        viewerBaseUrl: string;
        connectMode?: ConnectMode;
      };
      const base = handshake.viewerBaseUrl.replace(/\/$/, "");
      setViewerBase(base);
      if (handshake.connectMode) setConnectMode(handshake.connectMode);

      const helperUp = await checkHelper(base);
      if (!helperUp) {
        setPhase("helper_offline");
        return;
      }

      setPhase("starting");
      const sessionRes = await fetch(`${base}/v1/sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: handshake.token }),
      });
      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionJson.error ?? "Could not open browser");
      }

      const sessionId = sessionJson.sessionId as string;
      setEmbedSrc(`${base}/v1/embed?session=${sessionId}`);
      setPhase("streaming");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Connect failed");
      setPhase("error");
      toast.error(error instanceof Error ? error.message : "Connect failed");
    } finally {
      setLaunching(false);
    }
  }

  async function retryHelperCheck() {
    setRetrying(true);
    setPhase("checking_helper");
    try {
      const ok = await checkHelper(viewerBase);
      if (ok) {
        await beginConnect();
      } else {
        setPhase("helper_offline");
      }
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-5 sm:p-6">
      {phase === "idle" && (
        <>
          <p className="text-sm text-muted">
            Opens a live browser panel below so you can sign in to {label}. Cookies are
            encrypted and stored on Stackwise when login succeeds. Your password never
            leaves the platform.
          </p>
          <AdminActionButton
            variant="primary"
            busy={launching}
            busyLabel="Starting…"
            onClick={() => void beginConnect()}
          >
            Connect {label}
          </AdminActionButton>
          <p className="text-xs text-muted">
            {connectMode === "local"
              ? "Sign in in the panel below — no extra terminal or scripts."
              : "Runs on Stackwise — sign in in the panel below."}
          </p>
        </>
      )}

      {phase === "checking_helper" && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
          Preparing secure connect session…
        </p>
      )}

      {phase === "helper_offline" && (
        <div className="space-y-3 text-sm">
          <p className="text-amber-200/90">
            {connectMode === "local"
              ? "Could not start the in-app browser. Install Playwright once, then retry."
              : connectMode === "relay"
                ? "Remote connect service is unreachable. Check GROWTH_CONNECT_VIEWER_BASE and the Fly/Render app."
                : "Cloudflare Browser Rendering is not available. Enable the browser binding on your Worker and redeploy."}
          </p>
          {connectMode === "local" ? (
            <pre className="overflow-x-auto rounded-lg bg-black/50 p-3 text-xs">
              npx playwright install chromium
            </pre>
          ) : null}
          <AdminActionButton
            busy={retrying}
            busyLabel="Checking…"
            onClick={() => void retryHelperCheck()}
          >
            Retry
          </AdminActionButton>
        </div>
      )}

      {phase === "starting" && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
          Launching browser for {label}…
        </p>
      )}

      {phase === "streaming" && embedSrc ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Sign in below. When finished, this panel will show success automatically.
          </p>
          <iframe
            title={`${label} login`}
            src={embedSrc}
            className="h-[min(72vh,740px)] w-full rounded-lg border border-white/10 bg-black"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      ) : null}

      {phase === "complete" && (
        <div className="space-y-3">
          <p className="text-sm text-emerald-400">
            {label} is connected. You can harvest signals or return to settings.
          </p>
          <Link href="/admin/growth/settings" className={ADMIN_BTN_SECONDARY}>
            Back to settings
          </Link>
        </div>
      )}

      {phase === "error" && (
        <div className="space-y-3">
          <p className="text-sm text-amber-200/90">{errorMessage ?? "Something went wrong."}</p>
          <AdminActionButton onClick={() => void beginConnect()}>Try again</AdminActionButton>
        </div>
      )}

      {(phase === "streaming" || phase === "complete" || phase === "error") && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Link href="/admin/growth/settings" className={ADMIN_BTN_SECONDARY}>
            Settings
          </Link>
        </div>
      )}
    </div>
  );
}
