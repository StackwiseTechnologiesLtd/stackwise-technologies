"use client";

import { useState } from "react";

type PaymentMethod = "CARD" | "MOBILE_MONEY";

export function PayButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(method: PaymentMethod) {
    setLoading(method);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${slug}/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = (await res.json()) as { gatewayUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to start payment");
      window.location.href = data.gatewayUrl!;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => pay("CARD")}
          disabled={busy}
          className="rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {loading === "CARD" ? "Redirecting…" : "Pay with Card"}
        </button>
        <button
          type="button"
          onClick={() => pay("MOBILE_MONEY")}
          disabled={busy}
          className="rounded-xl border border-line bg-panel px-6 py-4 text-base font-semibold transition hover:bg-panel-hover disabled:opacity-60"
        >
          {loading === "MOBILE_MONEY" ? "Redirecting…" : "Pay with Mobile Money"}
        </button>
      </div>
      <p className="text-center text-xs text-muted">
        Secure payment via KPay — Visa/Mastercard or Mobile Money (M-Pesa, MTN, Orange, etc.)
      </p>
      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
