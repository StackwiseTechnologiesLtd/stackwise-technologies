"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { BTN_PRIMARY } from "@/lib/ui/buttons";

export function ContractFeedbackForm({ slug }: { slug: string }) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${slug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not send feedback");
      setSent(true);
      toast.success("Thank you — your comments were sent to Stackwise.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        We received your comments and will follow up by email.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-3 border-t border-[#e2e8f0] pt-8">
      <h2 className="text-base font-semibold text-[#0f172a]">Comments or requested changes</h2>
      <p className="text-sm text-[#64748b]">
        Share redlines, questions, or approval notes. This does not constitute legal
        acceptance — we will confirm next steps by email.
      </p>
      <textarea
        required
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm"
        placeholder="Your feedback…"
      />
      <button type="submit" disabled={loading} className={BTN_PRIMARY}>
        {loading ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
