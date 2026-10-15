"use client";

import { useToast } from "@/components/ToastProvider";
import type { IcpConfig, PlatformCredentialStatus } from "@/lib/growth/types";
import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY } from "@/lib/ui/admin";
import { useCallback, useEffect, useState } from "react";

export function GrowthSettingsPanel() {
  const toast = useToast();
  const [configText, setConfigText] = useState("");
  const [platforms, setPlatforms] = useState<PlatformCredentialStatus[]>([]);
  const [cookieJson, setCookieJson] = useState("");
  const [cookiePlatform, setCookiePlatform] = useState<"linkedin" | "x">("linkedin");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [icpRes, credRes] = await Promise.all([
        fetch("/api/admin/growth/icp"),
        fetch("/api/admin/growth/credentials"),
      ]);
      if (!icpRes.ok || !credRes.ok) throw new Error("Failed to load settings");
      const icp = (await icpRes.json()) as { config: IcpConfig };
      const cred = (await credRes.json()) as { platforms: PlatformCredentialStatus[] };
      setConfigText(JSON.stringify(icp.config, null, 2));
      setPlatforms(cred.platforms);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveIcp() {
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
    }
  }

  async function saveCookies() {
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
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  return (
    <div className="space-y-8">
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
        <button type="button" className={`${ADMIN_BTN_PRIMARY} mt-4`} onClick={() => void saveIcp()}>
          Save ICP
        </button>
      </section>

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Platform sessions</h3>
        <p className="mt-1 text-sm text-muted">
          Encrypted cookie jars for your local connector (LinkedIn and X). Never shared in API responses.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {platforms.map((p) => (
            <li key={p.platform} className="flex justify-between gap-4">
              <span className="font-medium capitalize">{p.platform}</span>
              <span className="text-muted">
                {p.connected
                  ? `Connected · updated ${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ""}`
                  : "Not connected"}
              </span>
            </li>
          ))}
        </ul>

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
        <button
          type="button"
          className={`${ADMIN_BTN_SECONDARY} mt-3`}
          onClick={() => void saveCookies()}
        >
          Upload cookies
        </button>
        <p className="mt-3 text-xs text-muted">
          Set <code className="text-foreground">GROWTH_CONNECTOR_SECRET</code> (32+ chars) for
          headless ingest from your machine. See docs/GROWTH_ENGINE.md.
        </p>
      </section>
    </div>
  );
}
