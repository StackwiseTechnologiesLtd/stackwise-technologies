"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { BTN_PRESS } from "@/lib/ui/buttons";

export function SubscribeButton({ slug }: { slug: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pay/subscribe/${slug}/init`, {
        method: "POST",
      });
      const data = (await res.json()) as { gatewayUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to start subscription");
      if (!data.gatewayUrl) throw new Error("Paystack did not return a checkout URL");
      window.location.assign(data.gatewayUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscription failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={subscribe}
        disabled={loading}
        className={`min-h-14 w-full rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white hover:bg-accent-hover ${BTN_PRESS}`}
      >
        {loading ? "Redirecting to Paystack…" : "Subscribe with card"}
      </button>
      <p className="text-center text-xs text-muted">
        Recurring card payments via Paystack. You can cancel from Paystack or contact
        Stackwise.
      </p>
    </div>
  );
}
