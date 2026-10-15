"use client";

import { useToast } from "@/components/ToastProvider";
import type { GrowthPlatform } from "@/lib/growth/types";
import { ADMIN_BTN_PRIMARY } from "@/lib/ui/admin";
import { useState } from "react";

export function GrowthCaptureForm({ onCreated }: { onCreated?: () => void }) {
  const toast = useToast();
  const [platform, setPlatform] = useState<GrowthPlatform>("linkedin");
  const [sourceUrl, setSourceUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/growth/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          sourceUrl: sourceUrl.trim() || undefined,
          authorName,
          roleTitle: roleTitle.trim() || undefined,
          bodyText,
        }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Could not ingest signal");
      }
      setSourceUrl("");
      setAuthorName("");
      setRoleTitle("");
      setBodyText("");
      toast.success("Lead scored and draft created");
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-4 rounded-xl border border-line bg-panel p-5 sm:p-6"
    >
      <div>
        <h3 className="text-base font-semibold tracking-tight">Capture a signal</h3>
        <p className="mt-1 text-sm text-muted">
          Paste a post or comment. We score fit and draft a reply for your review.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted">Platform</span>
          <select
            className="mt-1 w-full rounded-lg border border-line bg-black/50 px-3 py-2"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as GrowthPlatform)}
          >
            <option value="linkedin">LinkedIn</option>
            <option value="x">X</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-muted">Post URL</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-black/50 px-3 py-2"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Author name</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-line bg-black/50 px-3 py-2"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Role / title</span>
          <input
            className="mt-1 w-full rounded-lg border border-line bg-black/50 px-3 py-2"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Founder, CTO…"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-muted">What they said</span>
          <textarea
            required
            className="mt-1 min-h-28 w-full rounded-lg border border-line bg-black/50 px-3 py-2"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
        </label>
      </div>

      <button type="submit" className={ADMIN_BTN_PRIMARY} disabled={busy}>
        {busy ? "Working…" : "Score and draft reply"}
      </button>
    </form>
  );
}
