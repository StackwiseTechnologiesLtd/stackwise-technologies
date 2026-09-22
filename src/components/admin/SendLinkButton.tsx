"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SendLinkButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/payment-links/${id}/send`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setMessage("Payment link emailed to customer.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={send}
        disabled={loading}
        className="rounded-lg border border-line px-4 py-2 text-sm transition hover:bg-panel-hover disabled:opacity-50"
      >
        {loading ? "Sending…" : "Email payment link"}
      </button>
      {message && (
        <p className="mt-2 text-sm text-muted">{message}</p>
      )}
    </div>
  );
}
