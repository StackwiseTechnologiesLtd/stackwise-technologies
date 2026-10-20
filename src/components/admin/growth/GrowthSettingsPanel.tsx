"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { GrowthPlatformConnections } from "@/components/admin/growth/GrowthPlatformConnections";
import type { IcpConfig } from "@/lib/growth/types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

export function GrowthSettingsPanel() {
  const toast = useToast();
  const [configText, setConfigText] = useState("");
  const [cookieJson, setCookieJson] = useState("");
  const [cookiePlatform, setCookiePlatform] = useState<"linkedin" | "x">("linkedin");
  const [loading, setLoading] = useState(true);
  const [savingIcp, setSavingIcp] = useState(false);
  const [uploadingCookies, setUploadingCookies] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const icpRes = await fetch("/api/admin/growth/icp");
      if (!icpRes.ok) throw new Error("Failed to load settings");
      const icp = (await icpRes.json()) as { config: IcpConfig };
      setConfigText(JSON.stringify(icp.config, null, 2));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function saveIcp() {
    setSavingIcp(true);
    try {
      const config = JSON.parse(configText) as IcpConfig;
      const res = await fetch("/api/admin/growth/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("ICP rules saved");
    } catch {
      toast.error("Invalid JSON or save failed");
    } finally {
      setSavingIcp(false);
    }
  }

  async function saveCookies() {
    setUploadingCookies(true);
    try {
      const cookies = JSON.parse(cookieJson) as unknown;
      const res = await fetch("/api/admin/growth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: cookiePlatform,
          cookies,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      setCookieJson("");
      toast.success("Session cookies stored (encrypted)");
      await load();
    } catch {
      toast.error("Invalid cookie JSON or upload failed");
    } finally {
      setUploadingCookies(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  return (
    <div className="space-y-8">
      <GrowthPlatformConnections />

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">ICP and intent rules</h3>
        <p className="mt-1 text-sm text-muted">
          JSON used to score leads. Edit keywords and intent phrases, then save.
        </p>
        <textarea
          className="mt-4 min-h-64 w-full rounded-lg border border-line bg-black/50 px-3 py-2 font-mono text-xs"
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
        />
        <AdminActionButton
          variant="primary"
          className="mt-4"
          busy={savingIcp}
          busyLabel="Saving…"
          onClick={() => void saveIcp()}
        >
          Save ICP
        </AdminActionButton>
      </section>

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Manual cookie upload</h3>
        <p className="mt-1 text-sm text-muted">
          Fallback if you already export cookies from another tool. Prefer Connect above.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted">Platform</span>
            <select
              className="mt-1 w-full rounded-lg border border-line bg-black/50 px-3 py-2"
              value={cookiePlatform}
              onChange={(e) =>
                setCookiePlatform(e.target.value as "linkedin" | "x")
              }
            >
              <option value="linkedin">LinkedIn</option>
              <option value="x">X</option>
            </select>
          </label>
        </div>
        <textarea
          className="mt-3 min-h-32 w-full rounded-lg border border-line bg-black/50 px-3 py-2 font-mono text-xs"
          placeholder='Paste cookie JSON array from your connector…'
          value={cookieJson}
          onChange={(e) => setCookieJson(e.target.value)}
        />
        <AdminActionButton
          className="mt-3"
          busy={uploadingCookies}
          busyLabel="Uploading…"
          onClick={() => void saveCookies()}
        >
          Upload cookies
        </AdminActionButton>
        <p className="mt-3 text-xs text-muted">
          Set <code className="text-foreground">GROWTH_CONNECTOR_SECRET</code> (32+ chars) for
          headless ingest from your machine. See docs/GROWTH_ENGINE.md.
        </p>
      </section>
    </div>
  );
}
