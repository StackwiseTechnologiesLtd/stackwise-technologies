"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { useToast } from "@/components/ToastProvider";
import type { ContractEngagement } from "@/lib/contracts/types";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui/buttons";

export function ContractReviewPanel({
  engagement: initial,
}: {
  engagement: ContractEngagement;
}) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(initial.title);
  const [bodyMarkdown, setBodyMarkdown] = useState(initial.bodyMarkdown);
  const [preview, setPreview] = useState<ContractEngagement>(initial);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const canEdit =
    initial.status === "PENDING_REVIEW" ||
    initial.status === "FEEDBACK_RECEIVED" ||
    initial.status === "GENERATION_FAILED";
  const canSend =
    canEdit || initial.status === "FEEDBACK_RECEIVED";

  async function saveDraft() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contracts/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, bodyMarkdown }),
      });
      const data = (await res.json()) as { error?: string; engagement?: ContractEngagement };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setPreview(data.engagement!);
      toast.success("Draft saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    if (!confirm("Replace the current draft with a new AI generation?")) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/admin/contracts/${initial.id}/regenerate`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; engagement?: ContractEngagement };
      if (!res.ok) throw new Error(data.error ?? "Regenerate failed");
      const e = data.engagement!;
      setTitle(e.title);
      setBodyMarkdown(e.bodyMarkdown);
      setPreview(e);
      toast.success("New draft generated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setRegenerating(false);
    }
  }

  async function approveAndSend() {
    if (
      !confirm(
        `Send this agreement to ${initial.customerEmail}? They will receive an email with a review link.`,
      )
    ) {
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/admin/contracts/${initial.id}/send`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      toast.success("Agreement emailed to client.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  const previewEngagement: ContractEngagement = {
    ...preview,
    title,
    bodyMarkdown,
  };

  return (
    <div className="space-y-6">
      {initial.clientFeedback && (
        <div className="rounded-xl border border-amber-200/30 bg-amber-950/20 p-4">
          <p className="text-sm font-semibold text-amber-200">Client feedback</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-amber-100/90">
            {initial.clientFeedback}
          </p>
        </div>
      )}

      {initial.generationError && (
        <p className="text-sm text-amber-400">AI note: {initial.generationError}</p>
      )}

      {canEdit && (
        <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
          <label className="block text-sm">
            <span className="text-muted">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Body (markdown)</span>
            <textarea
              rows={16}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 font-mono text-xs leading-relaxed"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className={BTN_SECONDARY}
            >
              {saving ? "Saving…" : "Save edits"}
            </button>
            <button
              type="button"
              onClick={regenerate}
              disabled={regenerating}
              className={BTN_SECONDARY}
            >
              {regenerating ? "Regenerating…" : "Regenerate with AI"}
            </button>
            {(canSend || initial.status === "PENDING_REVIEW") && (
              <button
                type="button"
                onClick={approveAndSend}
                disabled={sending || !bodyMarkdown.trim()}
                className={BTN_PRIMARY}
              >
                {sending ? "Sending…" : "Approve & email client"}
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Preview</h2>
        <div className="overflow-hidden rounded-xl border border-line bg-[#eef2f6] p-3 sm:p-4">
          <ContractDocumentView engagement={previewEngagement} compact />
        </div>
      </div>
    </div>
  );
}
