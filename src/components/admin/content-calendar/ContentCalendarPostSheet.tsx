"use client";

import { ADMIN_BTN_PRIMARY, ADMIN_BTN_SECONDARY, ADMIN_INPUT, ADMIN_SELECT } from "@/lib/ui/admin";
import {
  contentCalendarChannelLabels,
  contentCalendarChannels,
  contentCalendarStatusLabels,
  contentCalendarStatuses,
  type ContentCalendarPostDetail,
} from "@/lib/content-calendar/types";
import { useToast } from "@/components/ToastProvider";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

function assetUrl(assetId: string): string {
  return `/api/admin/content-calendar/assets/${assetId}/file`;
}

export function ContentCalendarPostSheet({
  postId,
  scheduledOn,
  onClose,
  onSaved,
  onDeleted,
}: {
  postId: string | null;
  scheduledOn: string;
  onClose: () => void;
  onSaved: (createdId?: string) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const isNew = !postId;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(scheduledOn);
  const [time, setTime] = useState("");
  const [channel, setChannel] = useState<(typeof contentCalendarChannels)[number]>("instagram");
  const [status, setStatus] = useState<(typeof contentCalendarStatuses)[number]>("draft");
  const [script, setScript] = useState("");
  const [notes, setNotes] = useState("");
  const [accent, setAccent] = useState("#e85d8a");
  const [assets, setAssets] = useState<ContentCalendarPostDetail["assets"]>([]);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content-calendar/posts/${postId}`);
      if (!res.ok) throw new Error("Could not load post");
      const data = (await res.json()) as ContentCalendarPostDetail;
      setTitle(data.title);
      setDate(data.scheduledOn);
      setTime(data.scheduledTime ?? "");
      setChannel(data.channel);
      setStatus(data.status);
      setScript(data.script);
      setNotes(data.notes);
      setAccent(data.accent);
      setAssets(data.assets);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [postId, toast]);

  useDeferredEffect(() => {
    if (postId) void load();
    else setLoading(false);
  }, [postId, load]);

  async function save() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        scheduledOn: date,
        scheduledTime: time.trim() ? time.trim() : null,
        channel,
        status,
        script,
        notes,
        accent,
      };
      const res = await fetch(
        isNew ? "/api/admin/content-calendar" : `/api/admin/content-calendar/posts/${postId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Save failed");
      }
      const saved = (await res.json()) as ContentCalendarPostDetail;
      toast.toast(isNew ? "Post created" : "Post saved");
      onSaved(isNew ? saved.id : undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!postId) return;
    if (!window.confirm("Delete this post and its media?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content-calendar/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.toast("Post deleted");
      onDeleted();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length || !postId) {
      if (!postId) toast.error("Save the post before uploading media");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        const res = await fetch(`/api/admin/content-calendar/posts/${postId}/assets`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "Upload failed");
        }
        const asset = (await res.json()) as ContentCalendarPostDetail["assets"][number];
        setAssets((prev) => [...prev, asset]);
      }
      toast.toast("Media uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeAsset(assetId: string) {
    if (!window.confirm("Remove this file?")) return;
    try {
      const res = await fetch(`/api/admin/content-calendar/assets/${assetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Remove failed");
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  }

  return (
    <ThemedBackdrop onClose={onClose}>
      <div className="flex max-h-[min(92vh,52rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {isNew ? "New content post" : "Edit content post"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">Script, notes, and media for this slot.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted hover:bg-[var(--admin-nav-hover)] hover:text-foreground"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">Title</span>
                <input
                  className={ADMIN_INPUT}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Paid social creatives"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">Date</span>
                  <input
                    type="date"
                    className={ADMIN_INPUT}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">Time (optional)</span>
                  <input
                    type="time"
                    className={ADMIN_INPUT}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">Channel</span>
                  <select
                    className={ADMIN_SELECT}
                    value={channel}
                    onChange={(e) =>
                      setChannel(e.target.value as (typeof contentCalendarChannels)[number])
                    }
                  >
                    {contentCalendarChannels.map((c) => (
                      <option key={c} value={c}>
                        {contentCalendarChannelLabels[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">Status</span>
                  <select
                    className={ADMIN_SELECT}
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as (typeof contentCalendarStatuses)[number])
                    }
                  >
                    {contentCalendarStatuses.map((s) => (
                      <option key={s} value={s}>
                        {contentCalendarStatusLabels[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">Accent</span>
                <input
                  type="color"
                  className="h-10 w-full cursor-pointer rounded-md border border-[var(--admin-border)] bg-[var(--admin-canvas)]"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">Script / caption</span>
                <textarea
                  className={`${ADMIN_INPUT} min-h-[8rem] resize-y font-mono text-[13px] leading-relaxed`}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Hook, body, CTA, hashtags…"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">Production notes</span>
                <textarea
                  className={`${ADMIN_INPUT} min-h-[5rem] resize-y text-sm`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Shot list, links, approvals…"
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">Images & video</span>
                  <label className="cursor-pointer text-xs font-medium text-accent hover:underline">
                    {uploading ? "Uploading…" : "Add files"}
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*,video/*"
                      multiple
                      disabled={uploading || isNew}
                      onChange={(e) => void onUpload(e.target.files)}
                    />
                  </label>
                </div>
                {isNew ? (
                  <p className="text-xs text-muted">Save once, then attach media (stored in R2 on deploy).</p>
                ) : null}
                {assets.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3">
                    {assets.map((a) => {
                      const isVideo = a.contentType.startsWith("video/");
                      return (
                        <li
                          key={a.id}
                          className="group relative overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]"
                        >
                          {isVideo ? (
                            <video
                              src={assetUrl(a.id)}
                              className="aspect-[4/3] w-full object-cover"
                              controls
                              preload="metadata"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={assetUrl(a.id)}
                              alt={a.filename}
                              className="aspect-[4/3] w-full object-cover"
                            />
                          )}
                          <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[10px] text-muted">
                            <span className="truncate">{a.filename}</span>
                            <button
                              type="button"
                              className="shrink-0 text-accent hover:underline"
                              onClick={() => void removeAsset(a.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">No media yet.</p>
                )}
              </div>
            </>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border)] px-5 py-4">
          <div>
            {!isNew ? (
              <button
                type="button"
                className="text-sm text-red-500 hover:underline"
                onClick={() => void remove()}
                disabled={saving}
              >
                Delete post
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ADMIN_BTN_SECONDARY} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={ADMIN_BTN_PRIMARY}
              disabled={saving || loading}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : isNew ? "Create post" : "Save changes"}
            </button>
          </div>
        </footer>
      </div>
    </ThemedBackdrop>
  );
}

function ThemedBackdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
}