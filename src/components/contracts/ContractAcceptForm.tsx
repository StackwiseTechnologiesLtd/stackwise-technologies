"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { BTN_PRIMARY } from "@/lib/ui/buttons";

export function ContractAcceptForm({
  slug,
  disabled,
}: {
  slug: string;
  disabled?: boolean;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(Boolean(disabled));
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${slug}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptedByName: name }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not record acceptance");
      setAccepted(true);
      toast.success("Thank you — acceptance recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Acceptance recorded. Stackwise will follow up with kickoff and billing details.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] p-4">
      <h2 className="text-sm font-semibold text-[#0f172a]">Accept agreement</h2>
      <p className="text-xs leading-relaxed text-[#64748b]">
        Type your full name to confirm you are authorized to accept on behalf of the client
        organization. This is an electronic acknowledgment, not a substitute for counsel where
        required.
      </p>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full legal name"
        className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm"
      />
      <button type="submit" disabled={loading} className={BTN_PRIMARY}>
        {loading ? "Saving…" : "I accept this agreement"}
      </button>
    </form>
  );
}
