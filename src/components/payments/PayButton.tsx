"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import type { CheckoutPaymentMethod } from "@/lib/kpay/buildGatewayInit";
import { resolveCheckoutMethods, type PaymentMethodsOption } from "@/lib/payments/payment-methods";
import { BTN_PRESS } from "@/lib/ui/buttons";

const PAY_INIT_TIMEOUT_MS = 30_000;

async function readPayInitResponse(
  res: Response,
): Promise<{ gatewayUrl?: string; error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as { gatewayUrl?: string; error?: string };
  } catch {
    if (res.status === 504) {
      throw new Error(
        "Payment service timed out. Please try again — if this keeps happening, contact Stackwise.",
      );
    }
    throw new Error("Payment service returned an invalid response. Please try again.");
  }
}

export function PayButton({
  slug,
  allowedPaymentMethods,
  amountUsd,
  sticky = false,
}: {
  slug: string;
  allowedPaymentMethods: PaymentMethodsOption;
  amountUsd: number;
  sticky?: boolean;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState<CheckoutPaymentMethod | null>(null);

  const methods = useMemo(
    () => resolveCheckoutMethods(allowedPaymentMethods, amountUsd),
    [allowedPaymentMethods, amountUsd],
  );

  async function pay(method: CheckoutPaymentMethod) {
    setLoading(method);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PAY_INIT_TIMEOUT_MS);

    try {
      const res = await fetch(`/api/pay/${slug}/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
        signal: controller.signal,
      });
      const data = await readPayInitResponse(res);
      if (!res.ok) throw new Error(data.error ?? "Unable to start payment");
      if (!data.gatewayUrl) throw new Error("Payment provider did not return a checkout URL");
      window.location.assign(data.gatewayUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.error("Payment request timed out. Please try again.");
      } else {
        toast.error(err instanceof Error ? err.message : "Payment failed");
      }
      setLoading(null);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (methods.length === 0) {
    return (
      <p className="rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
        No payment methods are available for this invoice. Please contact Stackwise.
      </p>
    );
  }

  const content = (
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
            disabled={loading !== null}
            className={`min-h-14 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white hover:bg-accent-hover ${BTN_PRESS}`}
          >
            {loading === "CARD" ? "Redirecting to KPay…" : "Pay with Card"}
          </button>
        )}
        {methods.includes("MOBILE_MONEY") && (
          <button
            type="button"
            onClick={() => pay("MOBILE_MONEY")}
            disabled={loading !== null}
            className={`min-h-14 rounded-xl border border-line bg-panel px-6 py-4 text-base font-semibold hover:bg-panel-hover ${BTN_PRESS}`}
          >
            {loading === "MOBILE_MONEY"
              ? "Redirecting to KPay…"
              : "Pay with Mobile Money"}
          </button>
        )}
      </div>
      {!sticky && (
        <p className="text-center text-xs text-muted">
          Secure payment via KPay
          {methods.length === 2
            ? " — Visa/Mastercard or Mobile Money (M-Pesa, MTN, Orange, etc.)"
            : methods.includes("CARD")
              ? " — Visa/Mastercard"
              : " — Mobile Money (M-Pesa, MTN, Orange, etc.)"}
        </p>
      )}
    </div>
  );

  if (!sticky) return content;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#0b0b0b]/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      {content}
    </div>
  );
}
