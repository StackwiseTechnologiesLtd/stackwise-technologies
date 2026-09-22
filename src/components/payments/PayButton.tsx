"use client";

import { useMemo, useState } from "react";
import type { CheckoutPaymentMethod } from "@/lib/kpay/buildGatewayInit";
import { resolveCheckoutMethods, type PaymentMethodsOption } from "@/lib/payments/payment-methods";

export function PayButton({
  slug,
  allowedPaymentMethods,
  amountUsd,
}: {
  slug: string;
  allowedPaymentMethods: PaymentMethodsOption;
  amountUsd: number;
}) {
  const [loading, setLoading] = useState<CheckoutPaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  const methods = useMemo(
    () => resolveCheckoutMethods(allowedPaymentMethods, amountUsd),
    [allowedPaymentMethods, amountUsd],
  );

  async function pay(method: CheckoutPaymentMethod) {
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

  if (methods.length === 0) {
    return (
      <p className="rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
        No payment methods are available for this invoice. Please contact Stackwise.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={
          methods.length === 1
            ? "grid gap-3"
            : "grid gap-3 sm:grid-cols-2"
        }
      >
        {methods.includes("CARD") && (
          <button
            type="button"
            onClick={() => pay("CARD")}
            disabled={busy}
            className="rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {loading === "CARD" ? "Redirecting…" : "Pay with Card"}
          </button>
        )}
        {methods.includes("MOBILE_MONEY") && (
          <button
            type="button"
            onClick={() => pay("MOBILE_MONEY")}
            disabled={busy}
            className="rounded-xl border border-line bg-panel px-6 py-4 text-base font-semibold transition hover:bg-panel-hover disabled:opacity-60"
          >
            {loading === "MOBILE_MONEY" ? "Redirecting…" : "Pay with Mobile Money"}
          </button>
        )}
      </div>
      <p className="text-center text-xs text-muted">
        Secure payment via KPay
        {methods.length === 2
          ? " — Visa/Mastercard or Mobile Money (M-Pesa, MTN, Orange, etc.)"
          : methods.includes("CARD")
            ? " — Visa/Mastercard"
            : " — Mobile Money (M-Pesa, MTN, Orange, etc.)"}
      </p>
      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
