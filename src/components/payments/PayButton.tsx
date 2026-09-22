"use client";

import { useState } from "react";

export function PayButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${slug}/init`, { method: "POST" });
      const data = (await res.json()) as { gatewayUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to start payment");
      window.location.href = data.gatewayUrl!;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Redirecting to KPay…" : "Pay with Card"}
      </button>
      <p className="text-center text-xs text-muted">
        Secure card payment via KPay — Visa/Mastercard. Mobile Money also available on the payment page.
      </p>
      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
